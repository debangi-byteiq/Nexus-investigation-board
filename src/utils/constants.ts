import type { EntityType } from '../types';

export const ENTITY_COLORS: Record<EntityType, string> = {
  case:       '#ff5f5f',
  contact:    '#ff9040',
  connection: '#f0d040',
  annotation: '#3ed98a',
  related:    '#4ca8ff',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  case:       'Case / Incident',
  contact:    'Contact Record',
  connection: 'Connection Record',
  annotation: 'Annotation',
  related:    'Related Case Link',
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  case:       '📁',
  contact:    '👤',
  connection: '🔗',
  annotation: '📎',
  related:    '⬡',
};

export const ENTITY_RADII: Record<EntityType, number> = {
  case:       36,
  contact:    24,
  connection: 18,
  annotation: 20,
  related:    22,
};

export const LOADING_STEPS = [
  { key: 'context',     label: 'Reading Case Context from Form' },
  { key: 'contacts',    label: 'Fetching Contact Records' },
  { key: 'connections', label: 'Fetching Connection Records' },
  { key: 'annotations', label: 'Fetching Annotation Records' },
  { key: 'related',     label: 'Fetching Related Case Links' },
  { key: 'render',      label: 'Rendering Force Graph' },
] as const;

export const SIDEBAR_WIDTH = 400;
