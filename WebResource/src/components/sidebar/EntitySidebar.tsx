import React from 'react';
import type { GraphNode } from '../../types';
import { ENTITY_COLORS, ENTITY_ICONS, ENTITY_LABELS } from '../../utils/constants';
import EntityDetailContent from './EntityDetailContent';

interface Props {
  node: GraphNode | null;
  open: boolean;
  onClose: () => void;
  onRelatedCaseClick: (id: string) => void;
}

const EntitySidebar: React.FC<Props> = ({ node, open, onClose, onRelatedCaseClick }) => {
  const color = node ? ENTITY_COLORS[node.type] : 'var(--text3)';

  // Extract the record-level ID from details
  const getRecordId = (): string => {
    if (!node) return '';
    const d = node.details;
    switch (d.kind) {
      case 'case':       return d.caseId;
      case 'person':     return d.personId;
      case 'caseEntity': return d.caseEntityId;
      case 'firm':       return d.firmId;
      case 'vehicle':    return d.vehicleId;
      case 'location':   return d.locationId;
      case 'officer':    return d.officerId;
      case 'evidence':   return d.evidenceId;
      case 'incident':   return d.incidentId;
      case 'arrest':     return d.arrestId;
      default:           return '';
    }
  };

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
                {node?.label ?? ''}
              </h2>
              <div className="sidebar-entity-dv">
                {node ? (
                  <>
                    {getRecordId()}
                    {node.details.dvId ? ` · dv:${node.details.dvId}` : ''}
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
