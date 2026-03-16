import type { EntityType } from '../types';

export const ENTITY_COLORS: Record<EntityType, string> = {
  case:       '#ff5f5f',
  person:     '#ff9040',
  caseEntity: '#f0d040',
  evidence:   '#3ed98a',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  case:       'Case',
  person:     'Person',
  caseEntity: 'Case Entity',
  evidence:   'Evidence',
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  case:       '📁',
  person:     '👤',
  caseEntity: '🔗',
  evidence:   '📎',
};

export const ENTITY_RADII: Record<EntityType, number> = {
  case:       36,
  person:     24,
  caseEntity: 18,
  evidence:   20,
};

export const SIDEBAR_WIDTH = 400;

export const LOADING_STEPS = [
  { key: 'context', label: 'Loading case context…' },
  { key: 'contacts', label: 'Fetching linked persons…' },
  { key: 'connections', label: 'Resolving entities…' },
  { key: 'annotations', label: 'Retrieving evidence…' },
  { key: 'related', label: 'Finding related cases…' },
  { key: 'render', label: 'Rendering graph model…' },
];
