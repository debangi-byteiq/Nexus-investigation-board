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
  evidence: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect x="2" y="1" width="12" height="16" rx="1" fill={ENTITY_COLORS.evidence} opacity="0.9" />
      <polygon points="14,1 18,5 14,5" fill={ENTITY_COLORS.evidence} opacity="0.6" />
    </svg>
  ),
};

const LegendPanel: React.FC<Props> = ({ nodes, activeFilters, onToggleFilter, onClearFilters, shifted }) => {
  const counts = nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {});

  const types: EntityType[] = ['case', 'person', 'caseEntity', 'evidence'];

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
