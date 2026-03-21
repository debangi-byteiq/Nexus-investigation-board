import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphLink, EntityType } from '../types';
import { ENTITY_COLORS } from '../utils/constants';

interface UseD3GraphOptions {
  data: GraphData;
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  activeFilters: Set<EntityType>;
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

  // ── Setup SVG defs (arrows, glows) ─────────────────────────────────────────

  const setupDefs = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append('defs');

    defs.append('marker')
      .attr('id', 'arrow-neutral')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', 'rgba(162,178,204,0.45)');

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
      .attr('width', 26).attr('height', 26)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', 13).attr('cy', 13).attr('r', 0.75)
      .attr('fill', 'rgba(165,181,208,0.22)');
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
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 2.6)
          .attr('filter', `url(#glow-${d.type})`);
        sel.append('polygon')
          .attr('class', 'node-inner-ring')
          .attr('points', hexPoints(r - 8))
          .attr('fill', 'none')
          .attr('stroke', c).attr('stroke-width', 0.6).attr('stroke-opacity', 0.35);
      } else if (d.type === 'person') {
        sel.append('circle')
          .attr('class', 'node-shape')
          .attr('r', r)
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 2.2)
          .attr('filter', `url(#glow-${d.type})`);
        // Avatar ring
        sel.append('circle')
          .attr('class', 'node-inner-ring')
          .attr('r', r - 7)
          .attr('fill', 'none')
          .attr('stroke', c).attr('stroke-width', 0.5).attr('stroke-opacity', 0.3);
      } else if (d.type === 'caseEntity') {
        sel.append('rect')
          .attr('class', 'node-shape')
          .attr('x', -r).attr('y', -(r * 0.6))
          .attr('width', r * 2).attr('height', r * 1.2)
          .attr('rx', r * 0.6)
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 1.8)
          .attr('filter', `url(#glow-${d.type})`);
      } else if (d.type === 'firm') {
        sel.append('rect')
          .attr('class', 'node-shape')
          .attr('x', -r).attr('y', -r)
          .attr('width', r * 2).attr('height', r * 2)
          .attr('rx', 4)
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 1.9)
          .attr('filter', `url(#glow-${d.type})`);
      } else if (d.type === 'vehicle') {
        sel.append('rect')
          .attr('class', 'node-shape')
          .attr('x', -r).attr('y', -(r * 0.5))
          .attr('width', r * 2).attr('height', r)
          .attr('rx', r * 0.25)
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 1.9)
          .attr('filter', `url(#glow-${d.type})`);
        sel.append('circle')
          .attr('cx', -r * 0.45)
          .attr('cy', r * 0.62)
          .attr('r', r * 0.18)
          .attr('fill', c)
          .attr('fill-opacity', 0.35)
          .attr('stroke', c).attr('stroke-width', 1.1);
        sel.append('circle')
          .attr('cx', r * 0.45)
          .attr('cy', r * 0.62)
          .attr('r', r * 0.18)
          .attr('fill', c)
          .attr('fill-opacity', 0.35)
          .attr('stroke', c).attr('stroke-width', 1.1);
      } else if (d.type === 'location') {
        sel.append('path')
          .attr('class', 'node-shape')
          .attr('d', `M 0 ${-r} C ${-0.78 * r} ${-r}, ${-r} ${-0.36 * r}, ${-r} ${0.24 * r} C ${-r} ${0.88 * r}, ${-0.34 * r} ${1.22 * r}, 0 ${1.66 * r} C ${0.34 * r} ${1.22 * r}, ${r} ${0.88 * r}, ${r} ${0.24 * r} C ${r} ${-0.36 * r}, ${0.78 * r} ${-r}, 0 ${-r} Z`)
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 1.9)
          .attr('filter', `url(#glow-${d.type})`);
        sel.append('circle')
          .attr('cx', 0)
          .attr('cy', -r * 0.06)
          .attr('r', r * 0.24)
          .attr('fill', 'none')
          .attr('stroke', c)
          .attr('stroke-width', 1.1)
          .attr('stroke-opacity', 0.75);
      } else if (d.type === 'evidence') {
        // Document shape with dog-ear
        sel.append('rect')
          .attr('class', 'node-shape')
          .attr('x', -r).attr('y', -(r * 0.8))
          .attr('width', r * 2).attr('height', r * 1.6)
          .attr('rx', 3)
          .attr('fill', c).attr('fill-opacity', 0.2)
          .attr('stroke', c).attr('stroke-width', 1.8)
          .attr('filter', `url(#glow-${d.type})`);
        sel.append('polygon')
          .attr('points', `${r - 9},${-(r * 0.8)} ${r},${-(r * 0.8) + 9} ${r},${-(r * 0.8)}`)
          .attr('fill', c).attr('fill-opacity', 0.5);
      }
    });

    // Compact vector icon (entity marker)
    g.each(function (d) {
      const icon = d3.select(this)
        .append('g')
        .attr('class', 'node-icon')
        .attr('transform', () => {
          if (d.type === 'case') return 'scale(1.34)';
          if (d.type === 'person') return 'scale(1.28)';
          if (d.type === 'caseEntity') return 'scale(1.26)';
          if (d.type === 'firm') return 'scale(1.24)';
          if (d.type === 'vehicle') return 'scale(1.2)';
          if (d.type === 'location') return 'scale(1.22)';
          return 'scale(1.3)';
        })
        .attr('fill', 'rgba(244,248,255,0.96)')
        .attr('stroke', 'rgba(244,248,255,0.96)')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .style('pointer-events', 'none');

      icon.append('circle')
        .attr('cx', 0)
        .attr('cy', -0.2)
        .attr('r', d.type === 'case' ? 8.8 : 7.4)
        .attr('fill', 'rgba(7, 12, 23, 0.54)')
        .attr('stroke', 'rgba(220,228,245,0.26)')
        .attr('stroke-width', 0.85);

      if (d.type === 'case') {
        // Folder-like case icon
        icon.append('rect')
          .attr('x', -7.4)
          .attr('y', -4.4)
          .attr('width', 14.8)
          .attr('height', 9.6)
          .attr('rx', 1.8)
          .attr('fill', 'rgba(244,248,255,0.14)')
          .attr('stroke-width', 1.45);
        icon.append('path')
          .attr('d', 'M -6.3 -4.4 L -2.1 -4.4 L -0.9 -6.3 L 3.2 -6.3 L 4.5 -4.4')
          .attr('fill', 'none')
          .attr('stroke-width', 1.45);
      } else if (d.type === 'person') {
        // Person icon
        icon.append('circle')
          .attr('cx', 0)
          .attr('cy', -2.9)
          .attr('r', 2.45)
          .attr('fill', 'rgba(244,248,255,0.2)')
          .attr('stroke-width', 1.4);
        icon.append('path')
          .attr('d', 'M -5.3 4.2 C -4.2 1.6, -2.1 0.6, 0 0.6 C 2.1 0.6, 4.2 1.6, 5.3 4.2')
          .attr('fill', 'none')
          .attr('stroke-width', 1.55);
      } else if (d.type === 'caseEntity') {
        // Link icon
        icon.append('circle')
          .attr('cx', -3.5)
          .attr('cy', 0)
          .attr('r', 2.35)
          .attr('fill', 'none')
          .attr('stroke-width', 1.45);
        icon.append('circle')
          .attr('cx', 3.5)
          .attr('cy', 0)
          .attr('r', 2.35)
          .attr('fill', 'none')
          .attr('stroke-width', 1.45);
        icon.append('line')
          .attr('x1', -1.2)
          .attr('y1', 0)
          .attr('x2', 1.2)
          .attr('y2', 0)
          .attr('stroke-width', 1.45);
      } else if (d.type === 'firm') {
        // Building icon
        icon.append('rect')
          .attr('x', -4.9)
          .attr('y', -5.8)
          .attr('width', 9.8)
          .attr('height', 11.6)
          .attr('rx', 1.2)
          .attr('fill', 'rgba(244,248,255,0.14)')
          .attr('stroke-width', 1.35);
        icon.append('line').attr('x1', -2.9).attr('y1', -2.8).attr('x2', -1.6).attr('y2', -2.8).attr('stroke-width', 1.2);
        icon.append('line').attr('x1', 1.6).attr('y1', -2.8).attr('x2', 2.9).attr('y2', -2.8).attr('stroke-width', 1.2);
        icon.append('line').attr('x1', -2.9).attr('y1', 0).attr('x2', -1.6).attr('y2', 0).attr('stroke-width', 1.2);
        icon.append('line').attr('x1', 1.6).attr('y1', 0).attr('x2', 2.9).attr('y2', 0).attr('stroke-width', 1.2);
        icon.append('line').attr('x1', -0.8).attr('y1', 5.2).attr('x2', -0.8).attr('y2', 2.3).attr('stroke-width', 1.2);
        icon.append('line').attr('x1', 0.8).attr('y1', 5.2).attr('x2', 0.8).attr('y2', 2.3).attr('stroke-width', 1.2);
      } else if (d.type === 'vehicle') {
        // Car icon
        icon.append('path')
          .attr('d', 'M -5.8 1.8 L -4.2 -1.6 L 4.2 -1.6 L 5.8 1.8 Z')
          .attr('fill', 'rgba(244,248,255,0.12)')
          .attr('stroke-width', 1.35);
        icon.append('rect')
          .attr('x', -5.8)
          .attr('y', 1.6)
          .attr('width', 11.6)
          .attr('height', 2.7)
          .attr('rx', 1.2)
          .attr('fill', 'rgba(244,248,255,0.12)')
          .attr('stroke-width', 1.35);
        icon.append('circle').attr('cx', -3.2).attr('cy', 4.7).attr('r', 1.1).attr('fill', 'none').attr('stroke-width', 1.2);
        icon.append('circle').attr('cx', 3.2).attr('cy', 4.7).attr('r', 1.1).attr('fill', 'none').attr('stroke-width', 1.2);
      } else if (d.type === 'location') {
        // Pin icon
        icon.append('path')
          .attr('d', 'M 0 -5.9 C -2.8 -5.9 -4.7 -3.9 -4.7 -1.4 C -4.7 1.7 -1.9 3.5 0 6 C 1.9 3.5 4.7 1.7 4.7 -1.4 C 4.7 -3.9 2.8 -5.9 0 -5.9 Z')
          .attr('fill', 'rgba(244,248,255,0.14)')
          .attr('stroke-width', 1.35);
        icon.append('circle')
          .attr('cx', 0)
          .attr('cy', -1.4)
          .attr('r', 1.35)
          .attr('fill', 'none')
          .attr('stroke-width', 1.2);
      } else if (d.type === 'evidence') {
        // Document icon
        icon.append('rect')
          .attr('x', -5.2)
          .attr('y', -6.2)
          .attr('width', 10.4)
          .attr('height', 12.4)
          .attr('rx', 1.4)
          .attr('fill', 'rgba(244,248,255,0.15)')
          .attr('stroke-width', 1.35);
        icon.append('line')
          .attr('x1', -3)
          .attr('y1', -2)
          .attr('x2', 3)
          .attr('y2', -2)
          .attr('stroke-width', 1.3);
        icon.append('line')
          .attr('x1', -3)
          .attr('y1', 1.2)
          .attr('x2', 2.3)
          .attr('y2', 1.2)
          .attr('stroke-width', 1.3);
      }
    });

    // Label
    g.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 16)
      .attr('fill', 'rgba(234,241,255,0.98)')
      .attr('font-size', '10.8px')
      .attr('font-weight', '700')
      .attr('font-family', 'Space Grotesk, sans-serif')
      .style('pointer-events', 'none')
      .text((d) => d.label.length > 15 ? d.label.slice(0, 14) + '…' : d.label);

    // Sublabel
    g.append('text')
      .attr('class', 'node-sublabel')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 28)
      .attr('fill', 'rgba(148,168,205,0.88)')
      .attr('font-size', '8.9px')
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

    // Pin central case node
    const center = nodes.find(n => n.type === 'case');
    if (center) { center.fx = width / 2; center.fy = height / 2; }

    // ── Simulation
    const sim = d3.forceSimulation<GraphNode, GraphLink>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(l => {
          const tgt = l.target as GraphNode;
          if (tgt.type === 'caseEntity') return 110;
          if (tgt.type === 'firm' || tgt.type === 'vehicle' || tgt.type === 'location') return 130;
          if (tgt.type === 'evidence') return 170;
          return 165;
        })
        .strength(0.45))
      .force('charge', d3.forceManyBody().strength(-620))
      .force('collide', d3.forceCollide<GraphNode>(d => d.radius + 22))
      .force('x', d3.forceX(width / 2).strength(0.035))
      .force('y', d3.forceY(height / 2).strength(0.035));
    simulationRef.current = sim;

    // ── Links layer
    const linkG = gRoot.append('g').attr('class', 'links-layer');
    const linkSel = linkG.selectAll<SVGLineElement, GraphLink>('line')
      .data(links).enter().append('line')
      .attr('class', 'graph-link')
      .attr('stroke', l => {
        const t = (l.target as GraphNode).type;
        const base = ENTITY_COLORS[t] ?? '#a2b2cc';
        return d3.color(base)?.copy({ opacity: 0.45 })?.toString() ?? 'rgba(162,178,204,0.45)';
      })
      .attr('stroke-width', 1.25)
      .attr('stroke-opacity', 0.7)
      .attr('marker-end', 'url(#arrow-neutral)');

    // ── Link labels layer
    const linkLabelG = gRoot.append('g').attr('class', 'link-labels-layer');
    const linkLabelSel = linkLabelG.selectAll<SVGTextElement, GraphLink>('text')
      .data(links.filter(l => l.label)).enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'rgba(110,128,168,0.7)')
      .attr('font-size', '8px')
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
          if (d.type !== 'case') { d.fx = null; d.fy = null; }
        }))
      .on('click', (ev, d) => {
        ev.stopPropagation();
        selectedIdRef.current = d.id;
        highlightNeighbours(d.id);
        onNodeClick(d);
      })
      .on('mouseenter', (ev) => {
        d3.select(ev.currentTarget as SVGGElement)
          .select('.node-outer-ring').attr('fill-opacity', 0.18);
      })
      .on('mouseleave', (ev) => {
        d3.select(ev.currentTarget as SVGGElement)
          .select('.node-outer-ring').attr('fill-opacity', 0);
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
