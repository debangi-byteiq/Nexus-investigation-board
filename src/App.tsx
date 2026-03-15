import React, { useState, useCallback } from 'react';
import type { GraphNode, EntityType } from './types';
import { MOCK_GRAPH_DATA } from './data/mockData';
import GraphCanvas from './components/graph/GraphCanvas';
import EntitySidebar from './components/sidebar/EntitySidebar';
import './styles/main.css';

/**
 * NEXUS Investigation Board — Root Component
 *
 * Local dev:  Uses MOCK_GRAPH_DATA
 * In D365:   Replace with fetchGraphData(context.webAPI, caseId)
 *            from './data/dataverse'
 */

const App: React.FC = () => {
  // ── Graph data (mock for now, will come from Dataverse in PCF)
  const graphData = MOCK_GRAPH_DATA;

  // ── Graph state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(new Set());

  // ── Node click handler
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setSidebarOpen(true);
  }, []);

  // ── Background click handler (deselect)
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setSidebarOpen(false);
  }, []);

  // ── Sidebar close
  const handleSidebarClose = useCallback(() => {
    setSelectedNode(null);
    setSidebarOpen(false);
  }, []);

  // ── Related case navigation
  const handleRelatedCaseClick = useCallback((caseId: string) => {
    console.log(`Navigate to case ${caseId} in Dataverse`);
  }, []);

  // ── Open in Dataverse
  const handleOpenInDataverse = useCallback(() => {
    const id = selectedNode?.id ?? 'record';
    console.log(`Opening ${id} in Dataverse`);
  }, [selectedNode]);

  // ── Filter toggle
  const handleToggleFilter = useCallback((type: EntityType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  return (
    <div className="app-shell pcf-embed">
      <main className="board-area" role="main" aria-label="Investigation Board">
        <GraphCanvas
          data={graphData}
          activeFilters={activeFilters}
          sidebarOpen={sidebarOpen}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onToggleFilter={handleToggleFilter}
          onClearFilters={handleClearFilters}
        />

        <EntitySidebar
          node={selectedNode}
          open={sidebarOpen}
          onClose={handleSidebarClose}
          onRelatedCaseClick={handleRelatedCaseClick}
          onOpenInDataverse={handleOpenInDataverse}
        />
      </main>
    </div>
  );
};

export default App;
