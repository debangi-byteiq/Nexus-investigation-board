import React, { useRef, useEffect, useState } from 'react';
import type { GraphData, GraphNode, EntityType } from '../../types';
import { useD3Graph } from '../../hooks/useD3Graph';
import GraphControls from './GraphControls';
import LegendPanel from './LegendPanel';

interface Props {
  data: GraphData;
  activeFilters: Set<EntityType>;
  sidebarOpen: boolean;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  onToggleFilter: (type: EntityType) => void;
  onClearFilters: () => void;
}

const GraphCanvas: React.FC<Props> = ({
  data, activeFilters, sidebarOpen,
  onNodeClick, onBackgroundClick,
  onToggleFilter, onClearFilters,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

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

  const { zoomIn, zoomOut, fitView, reheat } = useD3Graph(svgRef, {
    data,
    width: dims.width,
    height: dims.height,
    onNodeClick,
    onBackgroundClick,
    activeFilters,
    searchQuery: '',
  });

  return (
    <div className={`graph-canvas-wrap ${sidebarOpen ? 'sidebar-active' : ''}`} ref={containerRef}>
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

      <GraphControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fitView}
        onReheat={reheat}
      />

      <LegendPanel
        nodes={data.nodes}
        activeFilters={activeFilters}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        shifted={sidebarOpen}
      />
    </div>
  );
};

export default GraphCanvas;
