import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphLink, D3Transform } from '../types';
import { ENTITY_COLORS } from '../utils/constants';

interface UseD3GraphOptions {
  data: GraphData;
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  activeFilters: Set<string>;
  searchQuery: string;
}

export function useD3Graph(
  svgRef: React.RefObject<SVGSVGElement | null>,
  options: UseD3GraphOptions
) {
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRootRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const selectedIdRef = useRef<string | null>(null);

  const { data, width, height, onNodeClick, onBackgroundClick, activeFilters, searchQuery } = options;

  // ── Geometry helpers ────────────────────────────────────────────────────────

  const hexPoints = (r: number): string =>
    d3.range(6).map(i => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${r * Math.cos(a)},${r * Math.sin(a)}`;
    }).join(' ');

  const diamondPoints = (r: number): string =>
    `0,${-r} ${r},0 0,${r} ${-r},0`;

  // ── Setup SVG defs (arrows, glows) ─────────────────────────────────────────

  const setupDefs = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append('defs');

    (Object.entries(ENTITY_COLORS) as [string, string][]).forEach(([type, color]) => {
      // Arrow marker
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 32).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4')
        .attr('fill', color)
        .attr('opacity', 0.6);

      // Glow filter
      const filt = defs.append('filter')
        .attr('id', `glow-${type}`)
        .attr('x', '-50%').attr('y', '-50%')
        .attr('width', '200%').attr('height', '200%');
      filt.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      const merge = filt.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');

      // Selected ring filter (brighter)
      const selFilt = defs.append('filter')
        .attr('id', `glow-selected-${type}`)
        .attr('x', '-80%').attr('y', '-80%')
        .attr('width', '260%').attr('height', '260%');
      selFilt.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
      const selMerge = selFilt.append('feMerge');
      selMerge.append('feMergeNode').attr('in', 'blur');
      selMerge.append('feMergeNode').attr('in', 'blur');
      selMerge.append('feMergeNode').attr('in', 'blur');
      selMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // Subtle grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'grid-dots')
      .attr('width', 30).attr('height', 30)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', 15).attr('cy', 15).attr('r', 0.8)
      .attr('fill', 'rgba(255,255,255,0.06)');
  }, []);

  // ── Draw a single node's shape ─────────────────────────────────────────────

  const drawNodeShape = useCallback((
    g: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
  ) => {
    const color = (d: GraphNode) => ENTITY_COLORS[d.type];

    // Outer glow ring (shown on hover/select)
    g.append('circle')
      .attr('class', 'node-outer-ring')
      .attr('r', (d) => d.radius + 14)
      .attr('fill', color)
      .attr('fill-opacity', 0)
      .attr('stroke', 'none');

    // Shape body per type
    g.each(function (d) {
      const sel = d3.select(this);
      const c = color(d);
      const r = d.radius;

      if (d.type === 'case') {
        // Hexagon with inner ring
        sel.append('polygon')
          .attr('class', 'node-shape')
          .attr('points', hexPoints(r))
          .attr('fill', c).attr('fill-opacity', 0.12)
          .attr('stroke', c).attr('stroke-width', 2.5)
          .attr('filter', `url(#glow-${d.type})`);
        sel.append('polygon')
          .attr('class', 'node-inner-ring')
          .attr('points', hexPoints(r - 8))
          .attr('fill', 'none')
          .attr('stroke', c).attr('stroke-width', 0.6).attr('stroke-opacity', 0.35);
      } else if (d.type === 'contact') {
        sel.append('circle')
          .attr('class', 'node-shape')
          .attr('r', r)
          .attr('fill', c).attr('fill-opacity', 0.12)
          .attr('stroke', c).attr('stroke-width', 2)
          .attr('filter', `url(#glow-${d.type})`);
        // Avatar ring
        sel.append('circle')
          .attr('class', 'node-inner-ring')
          .attr('r', r - 7)
          .attr('fill', 'none')
          .attr('stroke', c).attr('stroke-width', 0.5).attr('stroke-opacity', 0.3);
      } else if (d.type === 'connection') {
        sel.append('rect')
          .attr('class', 'node-shape')
          .attr('x', -r).attr('y', -(r * 0.6))
          .attr('width', r * 2).attr('height', r * 1.2)
          .attr('rx', r * 0.6)
          .attr('fill', c).attr('fill-opacity', 0.12)
          .attr('stroke', c).attr('stroke-width', 1.8)
          .attr('filter', `url(#glow-${d.type})`);
      } else if (d.type === 'annotation') {
        // Document shape with dog-ear
        sel.append('rect')
          .attr('class', 'node-shape')
          .attr('x', -r).attr('y', -(r * 0.8))
          .attr('width', r * 2).attr('height', r * 1.6)
          .attr('rx', 3)
          .attr('fill', c).attr('fill-opacity', 0.12)
          .attr('stroke', c).attr('stroke-width', 1.8)
          .attr('filter', `url(#glow-${d.type})`);
        sel.append('polygon')
          .attr('points', `${r - 9},${-(r * 0.8)} ${r},${-(r * 0.8) + 9} ${r},${-(r * 0.8)}`)
          .attr('fill', c).attr('fill-opacity', 0.5);
      } else if (d.type === 'related') {
        sel.append('polygon')
          .attr('class', 'node-shape')
          .attr('points', diamondPoints(r))
          .attr('fill', c).attr('fill-opacity', 0.12)
          .attr('stroke', c).attr('stroke-width', 1.8)
          .attr('stroke-dasharray', '5,2')
          .attr('filter', `url(#glow-${d.type})`);
      }
    });

    // Emoji icon
    g.append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('dy', '-0.1em')
      .attr('font-size', (d) => d.type === 'case' ? '18px' : '14px')
      .style('pointer-events', 'none')
      .text((d) => {
        const icons: Record<string, string> = {
          case: '📁', contact: '👤', connection: '🔗', annotation: '📎', related: '⬡',
        };
        return icons[d.type] ?? '◉';
      });

    // Label
    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 16)
      .attr('fill', 'rgba(220,228,245,0.92)')
      .attr('font-size', '10.5px')
      .attr('font-weight', '600')
      .attr('font-family', 'Space Grotesk, sans-serif')
      .style('pointer-events', 'none')
      .text((d) => d.label.length > 15 ? d.label.slice(0, 14) + '…' : d.label);

    // Sublabel
    g.append('text')
      .attr('class', 'node-sublabel')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 28)
      .attr('fill', 'rgba(110,128,168,0.75)')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('letter-spacing', '0.04em')
      .style('pointer-events', 'none')
      .text((d) => d.sublabel);
  }, []);

  // ── Init graph ──────────────────────────────────────────────────────────────

  const initGraph = useCallback(() => {
    if (!svgRef.current || width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Background grid
    svg.append('rect')
      .attr('width', '100%').attr('height', '100%')
      .attr('fill', 'url(#grid-dots)')
      .style('pointer-events', 'none');

    setupDefs(svg as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>);

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        gRoot.attr('transform', ev.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on('click', () => {
      selectedIdRef.current = null;
      onBackgroundClick();
      resetHighlight();
    });

    const gRoot = svg.append('g').attr('class', 'g-root');
    gRootRef.current = gRoot as unknown as d3.Selection<SVGGElement, unknown, null, undefined>;

    // Clone data for simulation mutation
    const nodes: GraphNode[] = data.nodes.map(n => ({ ...n }));
    const links: GraphLink[] = data.links.map(l => ({ ...l }));
    nodesRef.current = nodes;
    linksRef.current = links;

    // Pin center node
    const center = nodes.find(n => n.id === 'case-001');
    if (center) { center.fx = width / 2; center.fy = height / 2; }

    // ── Simulation
    const sim = d3.forceSimulation<GraphNode, GraphLink>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(l => {
          const tgt = l.target as GraphNode;
          if (tgt.type === 'connection') return 110;
          if (tgt.type === 'related') return 200;
          if (tgt.type === 'annotation') return 170;
          return 165;
        })
        .strength(0.45))
      .force('charge', d3.forceManyBody().strength(-700))
      .force('collide', d3.forceCollide<GraphNode>(d => d.radius + 22))
      .force('x', d3.forceX(width / 2).strength(0.035))
      .force('y', d3.forceY(height / 2).strength(0.035));
    simulationRef.current = sim;

    // ── Links layer
    const linkG = gRoot.append('g').attr('class', 'links-layer');
    const linkSel = linkG.selectAll<SVGLineElement, GraphLink>('line')
      .data(links).enter().append('line')
      .attr('class', 'graph-link')
      .attr('stroke', l => ENTITY_COLORS[(l.target as GraphNode).type] ?? '#fff')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.3)
      .attr('marker-end', l => `url(#arrow-${(l.target as GraphNode).type})`);

    // ── Link labels layer
    const linkLabelG = gRoot.append('g').attr('class', 'link-labels-layer');
    const linkLabelSel = linkLabelG.selectAll<SVGTextElement, GraphLink>('text')
      .data(links.filter(l => l.label)).enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'rgba(110,128,168,0.7)')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('letter-spacing', '0.04em')
      .style('pointer-events', 'none')
      .text(l => l.label);

    // ── Nodes layer
    const nodeG = gRoot.append('g').attr('class', 'nodes-layer');
    const nodeGrps = nodeG.selectAll<SVGGElement, GraphNode>('g.node-g')
      .data(nodes, d => d.id).enter().append('g')
      .attr('class', 'node-g')
      .attr('data-id', d => d.id)
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (ev, d) => {
          if (!ev.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => {
          if (!ev.active) sim.alphaTarget(0);
          if (d.id !== 'case-001') { d.fx = null; d.fy = null; }
        }))
      .on('click', (ev, d) => {
        ev.stopPropagation();
        selectedIdRef.current = d.id;
        highlightNeighbours(d.id);
        onNodeClick(d);
      })
      .on('mouseenter', (ev, d) => {
        d3.select(ev.currentTarget as SVGGElement)
          .select('.node-outer-ring').attr('fill-opacity', 0.18);
        // Show tooltip via DOM event
        const evt = new CustomEvent('nexus:tooltip', { detail: { node: d, x: ev.clientX, y: ev.clientY } });
        document.dispatchEvent(evt);
      })
      .on('mousemove', (ev) => {
        const evt = new CustomEvent('nexus:tooltip:move', { detail: { x: ev.clientX, y: ev.clientY } });
        document.dispatchEvent(evt);
      })
      .on('mouseleave', (ev) => {
        d3.select(ev.currentTarget as SVGGElement)
          .select('.node-outer-ring').attr('fill-opacity', 0);
        document.dispatchEvent(new CustomEvent('nexus:tooltip:hide'));
      });

    drawNodeShape(nodeGrps);

    // ── Tick
    sim.on('tick', () => {
      linkSel
        .attr('x1', l => (l.source as GraphNode).x ?? 0)
        .attr('y1', l => (l.source as GraphNode).y ?? 0)
        .attr('x2', l => (l.target as GraphNode).x ?? 0)
        .attr('y2', l => (l.target as GraphNode).y ?? 0);

      linkLabelSel
        .attr('x', l => (((l.source as GraphNode).x ?? 0) + ((l.target as GraphNode).x ?? 0)) / 2)
        .attr('y', l => (((l.source as GraphNode).y ?? 0) + ((l.target as GraphNode).y ?? 0)) / 2);

      nodeGrps.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Initial fit after layout settles
    setTimeout(() => fitView(), 800);
  }, [data, width, height, onNodeClick, onBackgroundClick, setupDefs, drawNodeShape]);

  // ── Highlight / dim ─────────────────────────────────────────────────────────

  const highlightNeighbours = useCallback((nodeId: string) => {
    if (!gRootRef.current) return;
    const neighbours = new Set<string>([nodeId]);
    linksRef.current.forEach(l => {
      const s = (l.source as GraphNode).id;
      const t = (l.target as GraphNode).id;
      if (s === nodeId) neighbours.add(t);
      if (t === nodeId) neighbours.add(s);
    });

    gRootRef.current.selectAll<SVGGElement, GraphNode>('.node-g')
      .attr('opacity', d => neighbours.has(d.id) ? 1 : 0.12);

    gRootRef.current.selectAll<SVGLineElement, GraphLink>('.graph-link')
      .attr('stroke-opacity', l => {
        const s = (l.source as GraphNode).id;
        const t = (l.target as GraphNode).id;
        return s === nodeId || t === nodeId ? 0.7 : 0.05;
      });

    // Selected node glow boost
    gRootRef.current.selectAll<SVGGElement, GraphNode>('.node-g')
      .select('.node-shape')
      .attr('filter', d => d.id === nodeId
        ? `url(#glow-selected-${d.type})`
        : `url(#glow-${d.type})`);
  }, []);

  const resetHighlight = useCallback(() => {
    if (!gRootRef.current) return;
    gRootRef.current.selectAll('.node-g').attr('opacity', 1);
    gRootRef.current.selectAll('.graph-link').attr('stroke-opacity', 0.3);
    gRootRef.current.selectAll<SVGGElement, GraphNode>('.node-g').select('.node-shape')
      .attr('filter', d => `url(#glow-${d.type})`);
  }, []);

  // ── Filter / search updates ─────────────────────────────────────────────────

  useEffect(() => {
    if (!gRootRef.current) return;
    gRootRef.current.selectAll<SVGGElement, GraphNode>('.node-g')
      .attr('opacity', d => {
        if (activeFilters.has(d.type)) return 0.08;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = d.label.toLowerCase().includes(q)
            || d.sublabel.toLowerCase().includes(q)
            || d.type.toLowerCase().includes(q);
          return match ? 1 : 0.1;
        }
        return 1;
      });
    gRootRef.current.selectAll<SVGLineElement, GraphLink>('.graph-link')
      .attr('stroke-opacity', l => {
        const st = (l.source as GraphNode).type;
        const tt = (l.target as GraphNode).type;
        if (activeFilters.has(st) || activeFilters.has(tt)) return 0.04;
        return 0.3;
      });
  }, [activeFilters, searchQuery]);

  // ── Zoom controls ───────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300)
      .call(zoomRef.current.scaleBy, 1.35);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300)
      .call(zoomRef.current.scaleBy, 0.74);
  }, [svgRef]);

  const fitView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(650)
      .call(zoomRef.current.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8).translate(-width / 2, -height / 2));
  }, [svgRef, width, height]);

  const reheat = useCallback(() => {
    simulationRef.current?.alpha(0.5).restart();
  }, []);

  // ── Init on mount ───────────────────────────────────────────────────────────

  useEffect(() => {
    initGraph();
    return () => { simulationRef.current?.stop(); };
  }, [initGraph]);

  return { zoomIn, zoomOut, fitView, reheat };
}
