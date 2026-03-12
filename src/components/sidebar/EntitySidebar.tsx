import React from 'react';
import type { GraphNode } from '../../types';
import { ENTITY_COLORS, ENTITY_ICONS, ENTITY_LABELS } from '../../utils/constants';
import EntityDetailContent from './EntityDetailContent';

interface Props {
  node: GraphNode | null;
  open: boolean;
  onClose: () => void;
  onRelatedCaseClick: (id: string) => void;
  onOpenInDataverse: () => void;
}

const EntitySidebar: React.FC<Props> = ({ node, open, onClose, onRelatedCaseClick, onOpenInDataverse }) => {
  const color = node ? ENTITY_COLORS[node.type] : 'var(--text3)';

  return (
    <>
      {/* Click-away backdrop */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`entity-sidebar ${open ? 'sidebar-open' : ''}`}
        aria-label="Entity detail panel"
        aria-hidden={!open}
        role="complementary"
      >
        {/* Top accent line */}
        <div
          className="sidebar-accent-line"
          style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            <div
              className="sidebar-entity-icon"
              style={{ background: color + '18', borderColor: color + '44' }}
              aria-hidden="true"
            >
              {node ? ENTITY_ICONS[node.type] : '◉'}
            </div>

            <div className="sidebar-title-col">
              <div
                className="sidebar-entity-type"
                style={{ color }}
              >
                {node ? ENTITY_LABELS[node.type] : ''}
              </div>
              <h2 className="sidebar-entity-name">
                {node?.details.name ?? ''}
              </h2>
              <div className="sidebar-entity-dv">
                {node ? (
                  <>
                    {('contactId' in node.details ? node.details.contactId
                      : 'caseId' in node.details ? node.details.caseId
                      : 'connectionId' in node.details ? node.details.connectionId
                      : 'annotationId' in node.details ? node.details.annotationId
                      : '') }
                    {'dvId' in node.details && node.details.dvId
                      ? ` · dv:${node.details.dvId}`
                      : ''}
                  </>
                ) : ''}
              </div>
            </div>

            <button
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close entity panel"
            >
              ✕
            </button>
          </div>

          {/* Open in Dataverse */}
          <button
            className="sidebar-dv-btn"
            onClick={onOpenInDataverse}
            aria-label="Open this record in Dataverse"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Record in Dataverse
          </button>
        </div>

        {/* Body */}
        <div className="sidebar-body" role="region" aria-label="Entity details">
          {node && (
            <EntityDetailContent
              details={node.details}
              accentColor={color}
              onRelatedCaseClick={onRelatedCaseClick}
            />
          )}
        </div>
      </aside>
    </>
  );
};

export default EntitySidebar;
