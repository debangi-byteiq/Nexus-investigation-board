import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GraphData, GraphNode, EntityType } from '../../types';
import { useD3Graph } from '../../hooks/useD3Graph';
import GraphControls from './GraphControls';
import SearchBar from './SearchBar';
import LegendPanel from './LegendPanel';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: GraphNode | null;
}

interface Props {
  data: GraphData;
  activeFilters: Set<EntityType>;
  searchQuery: string;
  sidebarOpen: boolean;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  onToggleFilter: (type: EntityType) => void;
  onClearFilters: () => void;
  onSearchChange: (q: string) => void;
  onReheat: () => void;
}

const GraphCanvas: React.FC<Props> = ({
  data, activeFilters, searchQuery, sidebarOpen,
  onNodeClick, onBackgroundClick,
  onToggleFilter, onClearFilters, onSearchChange, onReheat: onReheatProp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, node: null });

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    const { width, height } = el.getBoundingClientRect();
    setDims({ width, height });
    return () => ro.disconnect();
  }, []);

  // Listen for tooltip events from D3
  useEffect(() => {
    const showHandler = (e: Event) => {
      const { node, x, y } = (e as CustomEvent).detail;
      setTooltip({ visible: true, x, y, node });
    };
    const moveHandler = (e: Event) => {
      const { x, y } = (e as CustomEvent).detail;
      setTooltip(prev => ({ ...prev, x, y }));
    };
    const hideHandler = () => setTooltip(prev => ({ ...prev, visible: false }));
    document.addEventListener('nexus:tooltip', showHandler);
    document.addEventListener('nexus:tooltip:move', moveHandler);
    document.addEventListener('nexus:tooltip:hide', hideHandler);
    return () => {
      document.removeEventListener('nexus:tooltip', showHandler);
      document.removeEventListener('nexus:tooltip:move', moveHandler);
      document.removeEventListener('nexus:tooltip:hide', hideHandler);
    };
  }, []);

  const { zoomIn, zoomOut, fitView, reheat } = useD3Graph(svgRef, {
    data,
    width: dims.width,
    height: dims.height,
    onNodeClick,
    onBackgroundClick,
    activeFilters,
    searchQuery,
  });

  const handleReheat = useCallback(() => {
    reheat();
    onReheatProp();
  }, [reheat, onReheatProp]);

  return (
    <div className="graph-canvas-wrap" ref={containerRef}>
      {/* Background ambient blobs */}
      <div className="graph-ambient" aria-hidden="true">
        <div className="ambient-blob blob-blue" />
        <div className="ambient-blob blob-red" />
        <div className="ambient-blob blob-green" />
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        id="graph-svg"
        aria-label="Case entity relationship graph"
        role="img"
      />

      {/* Floating controls */}
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      <GraphControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fitView}
        onReheat={handleReheat}
      />
      <LegendPanel
        nodes={data.nodes}
        activeFilters={activeFilters}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        shifted={sidebarOpen}
      />

      {/* Tooltip */}
      {tooltip.visible && tooltip.node && (
        <div
          className="graph-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 44 }}
          aria-hidden="true"
        >
          <span className="tooltip-label">{tooltip.node.label}</span>
          <span className="tooltip-sep">·</span>
          <span className="tooltip-type">{tooltip.node.type}</span>
        </div>
      )}

      {/* Hint */}
      <div className="graph-hint" aria-hidden="true">
        Click entity to inspect · Scroll to zoom · Drag nodes to reposition
      </div>
    </div>
  );
};

export default GraphCanvas;
