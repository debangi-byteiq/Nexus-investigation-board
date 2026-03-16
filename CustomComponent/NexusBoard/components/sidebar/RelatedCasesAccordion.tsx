import React, { useState } from 'react';
import type { RelatedCaseRef } from '../../types';

interface Props {
  cases: RelatedCaseRef[];
  onCaseClick: (caseId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Open:   'var(--c-case)',
  Active: 'var(--c-annot)',
  Closed: 'var(--text3)',
  Cold:   'var(--text3)',
};

const RelatedCasesAccordion: React.FC<Props> = ({ cases, onCaseClick }) => {
  const [open, setOpen] = useState(false);

  if (!cases.length) return null;

  return (
    <div className="related-accordion">
      <button
        className={`related-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="related-cases-list"
      >
        <span className="related-trigger-icon" aria-hidden="true">⬡</span>
        <span className="related-trigger-text">
          <span className="related-trigger-title">View Related Cases</span>
          <span className="related-trigger-sub">Cases sharing this entity in Dataverse</span>
        </span>
        <span className="related-count" aria-label={`${cases.length} related cases`}>{cases.length}</span>
        <span className={`related-arrow ${open ? 'open' : ''}`} aria-hidden="true">▾</span>
      </button>

      <div
        id="related-cases-list"
        className={`related-list ${open ? 'open' : ''}`}
        role="list"
      >
        {cases.map(rc => (
          <button
            key={rc.id}
            className="related-case-item"
            onClick={() => onCaseClick(rc.id)}
            role="listitem"
            aria-label={`Open case ${rc.id}: ${rc.name}`}
          >
            <div
              className="related-case-bar"
              style={{ background: STATUS_COLORS[rc.status] ?? 'var(--text3)' }}
              aria-hidden="true"
            />
            <div className="related-case-body">
              <div className="related-case-id">{rc.id}</div>
              <div className="related-case-name">{rc.name}</div>
              <div className="related-case-match">{rc.matchReason}</div>
            </div>
            <span className="related-case-status" style={{ color: STATUS_COLORS[rc.status] }}>
              {rc.status}
            </span>
            <span className="related-case-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedCasesAccordion;
