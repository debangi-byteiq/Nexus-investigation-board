import React, { useState, useCallback } from 'react';
import type { GraphNode, EntityType, GraphData } from './types';
import { MOCK_GRAPH_DATA } from './data/mockData';
import { DataverseWebAPI } from './data/dataverse';
import GraphCanvas from './components/graph/GraphCanvas';
import EntitySidebar from './components/sidebar/EntitySidebar';

/**
 * NEXUS Investigation Board — Root Component
 *
 * When used inside PCF:
 *   <App graphData={data} webAPI={context.webAPI} />
 *
 * When used locally (no props / graphData=null):
 *   Falls back to MOCK_GRAPH_DATA for development
 */

export interface AppProps {
  graphData?: GraphData | null;
  webAPI?: DataverseWebAPI;
  loading?: boolean;
  error?: string;
}

export const App: React.FC<AppProps> = ({
  graphData: externalData,
  loading = false,
  error,
}) => {
  // Use external (Dataverse) data if provided, else mock data for local dev
  const graphData = externalData ?? MOCK_GRAPH_DATA;

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

  // ── Loading state
  if (loading) {
    return (
      <div className="app-shell pcf-embed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ color: '#aaa', fontFamily: 'Segoe UI, sans-serif', fontSize: '16px' }}>
          ⏳ Loading investigation data…
        </div>
      </div>
    );
  }

  // ── Error state
  if (error) {
    return (
      <div className="app-shell pcf-embed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ color: '#ff5f5f', fontFamily: 'Segoe UI, sans-serif', fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>
          ❌ Failed to load investigation data.<br />
          <small style={{ color: '#888' }}>{error}</small>
        </div>
      </div>
    );
  }

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
