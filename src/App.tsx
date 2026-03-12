import React, { useState, useCallback } from 'react';
import type { GraphNode, EntityType } from './types';
import { GRAPH_DATA, CASE_CONTEXT } from './data/mockData';
import { useLoadingSequence } from './hooks/useLoadingSequence';
import { useToast } from './hooks/useToast';
import LoadingScreen from './components/ui/LoadingScreen';
import Toast from './components/ui/Toast';
import TopBar from './components/layout/TopBar';
import CaseBand from './components/layout/CaseBand';
import GraphCanvas from './components/graph/GraphCanvas';
import EntitySidebar from './components/sidebar/EntitySidebar';
import './styles/main.css';

const App: React.FC = () => {
  // ── Loading
  const { currentStep, completedSteps, progress, isLoaded } = useLoadingSequence();

  // ── Toast
  const { message: toastMsg, visible: toastVisible, showToast } = useToast();

  // ── Graph state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [syncTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

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
    showToast(`Navigating to case ${caseId} in Dataverse…`);
  }, [showToast]);

  // ── Open in Dataverse
  const handleOpenInDataverse = useCallback(() => {
    const id = selectedNode?.id ?? 'record';
    showToast(`Opening ${id} in Dataverse…`);
  }, [selectedNode, showToast]);

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

  // ── Reheat
  const handleReheat = useCallback(() => {
    showToast('Graph layout re-energised');
  }, [showToast]);

  return (
    <div className="app-shell">
      {/* Loading overlay (unmounts from DOM after transition) */}
      <LoadingScreen
        currentStep={currentStep}
        completedSteps={completedSteps}
        progress={progress}
        visible={!isLoaded}
      />

      {/* Host application chrome */}
      <TopBar caseContext={CASE_CONTEXT} />
      <CaseBand
        caseContext={CASE_CONTEXT}
        nodeCount={GRAPH_DATA.nodes.length}
        edgeCount={GRAPH_DATA.links.length}
        syncTime={isLoaded ? syncTime : '—'}
      />

      {/* PCF Component Board */}
      <main className="board-area" role="main" aria-label="Investigation Board">
        <GraphCanvas
          data={GRAPH_DATA}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          sidebarOpen={sidebarOpen}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onToggleFilter={handleToggleFilter}
          onClearFilters={handleClearFilters}
          onSearchChange={setSearchQuery}
          onReheat={handleReheat}
        />

        <EntitySidebar
          node={selectedNode}
          open={sidebarOpen}
          onClose={handleSidebarClose}
          onRelatedCaseClick={handleRelatedCaseClick}
          onOpenInDataverse={handleOpenInDataverse}
        />
      </main>

      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  );
};

export default App;
