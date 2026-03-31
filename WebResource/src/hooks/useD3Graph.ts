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

const ENTITY_ICON_PATHS: Record<EntityType, string[]> = {
  case:  ["M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
"M14 2v5a1 1 0 0 0 1 1h5",
"M8 18v-2",
"M12 18v-4",
"M16 18v-6"],
  person:     ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  caseEntity: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  firm:       ["M10 12h4",
"M10 8h4",
"M14 21v-3a2 2 0 0 0-4 0v3",
"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"],
  vehicle:    ['M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3', 'M14 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0', 'M6 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0'],
  location:   ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  evidence:   [
    "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
    "M14 13.12c0 2.38 0 6.38-1 8.88",
    "M17.29 21.02c.12-.6.43-2.3.5-3.02",
    "M2 12a10 10 0 0 1 18-6",
    "M2 16h.01",
    "M21.8 16c.2-2 .131-5.354 0-6",
    "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
    "M8.65 22c.21-.66.45-1.32.57-2",
    "M9 6.8a6 6 0 0 1 9 5.2v2",
  ],

  incident:   ["M7 18v-6a5 5 0 1 1 10 0v6",
"M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z",
"M21 12h1",
"M18.5 4.5 18 5",
"M2 12h1",
"M12 2v1",
"m4.929 4.929.707.707",
"M12 12v6"],
  arrest:     ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', 'M9 12l2 2 4-4'],
};

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

  // ── Draw a single node's shape ───
 
  const drawNodeShape = useCallback((
  g: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
) => {
  const color = (d: GraphNode) => ENTITY_COLORS[d.type];

  // Outer glow ring
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
      // Hexagon with inner ring — unchanged
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
    } else {
      // All other types: circle with matching color
      sel.append('circle')
        .attr('class', 'node-shape')
        .attr('r', r)
        .attr('fill', c).attr('fill-opacity', 0.2)
        .attr('stroke', c).attr('stroke-width', 2.0)
        .attr('filter', `url(#glow-${d.type})`);
      sel.append('circle')
        .attr('class', 'node-inner-ring')
        .attr('r', r - 7)
        .attr('fill', 'none')
        .attr('stroke', c).attr('stroke-width', 0.5).attr('stroke-opacity', 0.3);
    }
  });

  // Icon
  g.each(function(d) {
    const iconG = d3.select(this)
      .append('g')
      .attr('class', 'node-icon')
      .style('pointer-events', 'none');

    iconG.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', d.type === 'case' ? 9.5 : 8)
      .attr('fill', 'rgba(7, 12, 23, 0.54)')
      .attr('stroke', 'rgba(220,228,245,0.26)')
      .attr('stroke-width', 0.85);

    const paths = ENTITY_ICON_PATHS[d.type];
    if (!paths) return;

    const scale = (d.type === 'case' ? 9.5 : 8) / 12;

    iconG.append('g')
      .attr('transform', `scale(${scale}) translate(-12,-12)`)
      .selectAll('path')
      .data(paths)
      .enter()
      .append('path')
      .attr('d', p => p)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(244,248,255,0.92)')
      .attr('stroke-width', 2 / scale)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');
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

  if (tgt.type === 'caseEntity') return 160;
  if (tgt.type === 'firm' || tgt.type === 'vehicle' || tgt.type === 'location') return 190;
  if (tgt.type === 'evidence') return 240;
  if (tgt.type === 'incident' || tgt.type === 'arrest') return 210;

  return 220;
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

  // ── Highlight / dim ──

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

  // ── Filter / search updates ──

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

  // ── Zoom controls ──

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
