import React from 'react';

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReheat: () => void;
}

const GraphControls: React.FC<Props> = ({ onZoomIn, onZoomOut, onFit, onReheat }) => {
  return (
    <div className="graph-controls" role="toolbar" aria-label="Graph navigation controls">
      <button className="ctrl-btn" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
      <button className="ctrl-btn" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
      <button className="ctrl-btn" onClick={onFit} title="Fit to view" aria-label="Fit graph to view">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="1,5 1,1 5,1" /><polyline points="9,1 13,1 13,5" />
          <polyline points="13,9 13,13 9,13" /><polyline points="5,13 1,13 1,9" />
        </svg>
      </button>
      <div className="ctrl-sep" aria-hidden="true" />
      <button className="ctrl-btn" onClick={onReheat} title="Re-energise layout" aria-label="Re-run graph layout">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 7a5 5 0 11-2-4"/><polyline points="10,1 12,4 9,5" />
        </svg>
      </button>
    </div>
  );
};

export default GraphControls;
