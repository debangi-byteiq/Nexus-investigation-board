import React from 'react';
import type { EntityType, GraphNode } from '../../types';
import { ENTITY_COLORS, ENTITY_LABELS } from '../../utils/constants';

interface Props {
  nodes: GraphNode[];
  activeFilters: Set<EntityType>;
  onToggleFilter: (type: EntityType) => void;
  onClearFilters: () => void;
  shifted: boolean;
}

const SHAPE_SVG: Record<EntityType, React.ReactNode> = {
  case: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <polygon points="9,1 17,5 17,13 9,17 1,13 1,5" fill={ENTITY_COLORS.case} opacity="0.9" />
    </svg>
  ),
  person: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="8" fill={ENTITY_COLORS.person} opacity="0.9" />
    </svg>
  ),
  caseEntity: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="1" y="5" width="16" height="8" rx="4" fill={ENTITY_COLORS.caseEntity} opacity="0.9" />
    </svg>
  ),
  firm: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="2" y="2" width="14" height="14" rx="2" fill={ENTITY_COLORS.firm} opacity="0.9" />
    </svg>
  ),
  vehicle: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="1" y="6" width="16" height="7" rx="2" fill={ENTITY_COLORS.vehicle} opacity="0.9" />
      <circle cx="5" cy="14" r="1.5" fill={ENTITY_COLORS.vehicle} opacity="0.95" />
      <circle cx="13" cy="14" r="1.5" fill={ENTITY_COLORS.vehicle} opacity="0.95" />
    </svg>
  ),
  location: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M9 1.5C6 1.5 3.8 3.8 3.8 6.7c0 3.8 4.4 8.6 5.2 9.4c0.8-0.8 5.2-5.6 5.2-9.4C14.2 3.8 12 1.5 9 1.5z" fill={ENTITY_COLORS.location} opacity="0.9" />
      <circle cx="9" cy="6.8" r="2" fill="rgba(8, 16, 30, 0.5)" />
    </svg>
  ),
  evidence: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="2" y="1" width="12" height="16" rx="1" fill={ENTITY_COLORS.evidence} opacity="0.9" />
      <polygon points="14,1 18,5 14,5" fill={ENTITY_COLORS.evidence} opacity="0.6" />
    </svg>
  ),
  incident: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <polygon points="9,1 17,9 9,17 1,9" fill={ENTITY_COLORS.incident} opacity="0.9" />
    </svg>
  ),
  arrest: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <polygon points="6,1 12,1 17,6 17,12 12,17 6,17 1,12 1,6" fill={ENTITY_COLORS.arrest} opacity="0.9" />
    </svg>
  ),
};

const LegendPanel: React.FC<Props> = ({ nodes, activeFilters, onToggleFilter, onClearFilters, shifted }) => {
  const counts = nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {});

  const types: EntityType[] = ['case', 'person', 'caseEntity', 'firm', 'vehicle', 'location', 'evidence', 'incident', 'arrest'];

  return (
    <div className={`legend-panel ${shifted ? 'legend-shifted' : ''}`} role="complementary" aria-label="Entity type legend">
      <div className="legend-header">
        <span className="legend-title">Entity Types</span>
        {activeFilters.size > 0 && (
          <button className="legend-reset-btn" onClick={onClearFilters} aria-label="Clear all filters">
            Reset
          </button>
        )}
      </div>

      {types.map(type => (
        <button
          key={type}
          className={`legend-row ${activeFilters.has(type) ? 'filtered' : ''}`}
          onClick={() => onToggleFilter(type)}
          aria-pressed={activeFilters.has(type)}
          aria-label={`${activeFilters.has(type) ? 'Show' : 'Hide'} ${ENTITY_LABELS[type]} nodes`}
        >
          <div className="legend-shape">{SHAPE_SVG[type]}</div>
          <span className="legend-label" style={{ color: activeFilters.has(type) ? 'var(--text3)' : 'var(--text2)' }}>
            {ENTITY_LABELS[type]}
          </span>
          <span className="legend-count">{counts[type] ?? 0}</span>
        </button>
      ))}
    </div>
  );
};

export default LegendPanel;
