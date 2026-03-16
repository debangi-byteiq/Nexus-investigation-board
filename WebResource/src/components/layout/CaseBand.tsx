import React from 'react';
import type { CaseContext } from '../../types';

interface Props {
  caseContext: CaseContext;
  nodeCount: number;
  edgeCount: number;
  syncTime: string;
}

const CaseBand: React.FC<Props> = ({ caseContext, nodeCount, edgeCount, syncTime }) => {
  return (
    <div className="case-band">
      <div className="case-band-accent-bar" aria-hidden="true" />

      <span className="case-band-type-tag">Incident</span>

      <h1 className="case-band-id">{caseContext.caseId}</h1>
      <span className="case-band-sep" aria-hidden="true">—</span>
      <span className="case-band-name">
        {caseContext.caseName} · {caseContext.caseType}
      </span>

      <div
        className={`case-band-status-pill status-${caseContext.status.toLowerCase()}`}
        role="status"
      >
        <span className="status-pulse-dot" aria-hidden="true" />
        {caseContext.status} · {caseContext.priority} Priority
      </div>

      <div className="case-band-metrics" aria-label="Graph statistics">
        <div className="metric">
          <span className="metric-label">Entities</span>
          <span className="metric-val">{nodeCount || '—'}</span>
        </div>
        <div className="metric-divider" />
        <div className="metric">
          <span className="metric-label">Relationships</span>
          <span className="metric-val">{edgeCount || '—'}</span>
        </div>
        <div className="metric-divider" />
        <div className="metric">
          <span className="metric-label">Synced</span>
          <span className="metric-val">{syncTime || '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default CaseBand;
