import React from 'react';
import type { EntityType, GraphNode } from '../../types';
import { ENTITY_COLORS, ENTITY_LABELS, ENTITY_ICONS } from '../../utils/constants';

interface Props {
  nodes: GraphNode[];
  activeFilters: Set<EntityType>;
  onToggleFilter: (type: EntityType) => void;
  onClearFilters: () => void;
  shifted: boolean;
}



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
      <div style={{
        display: 'flex',
        flexDirection: 'column', 
        alignItems: 'left',  
        gap: '10px',              
        padding: '8px 4px',
        width: '100%'          
      }}>
      {types.map(type => {
        const Icon = ENTITY_ICONS[type];
        const color = ENTITY_COLORS[type];

        return (
          <button
            key={type}
            className={`legend-row ${activeFilters.has(type) ? 'filtered' : ''}`}
            onClick={() => onToggleFilter(type)}
            aria-pressed={activeFilters.has(type)}
            
          >
            {/* 2. The Colored Circle Container */}
            <div 
              className="legend-icon-container" 
              style={{ 
                backgroundColor: `${color}20`, 
                border: `1px solid ${color}`,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon size={14} color={color} strokeWidth={2.5} />
            </div>

            <span className="legend-label" style={{ color: activeFilters.has(type) ? 'var(--text3)' : 'var(--text2)' }}>
              {ENTITY_LABELS[type]}
            </span>
            <span className="legend-count">{counts[type] ?? 0}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
};

export default LegendPanel;