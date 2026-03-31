import type { EntityType } from '../types';
import { FileChartColumn, User, Fingerprint, Eye, HatGlassesIcon, Car, Building2, MapPin, Siren } from 'lucide-react';

export const ENTITY_COLORS: Record<EntityType, string> = {
  case:       '#ff5f5f',
  person:     '#ff9040',
  caseEntity: '#f0d040',
  firm:       '#56c7ff',
  vehicle:    '#b888ff',
  location:   '#3dd1c3',
  evidence:   '#3ed98a',
  incident:   '#ff7aa8',
  arrest:     '#7cc7ff',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  case:       'Case',
  person:     'Person',
  caseEntity: 'Case Entity',
  firm:       'Firm',
  vehicle:    'Vehicle',
  location:   'Location',
  evidence:   'Evidence',
  incident:   'Incident',
  arrest:     'Arrest',
};

export const ENTITY_ICONS: Record<EntityType, any> = {
  case: FileChartColumn,
  person: User,
  caseEntity: Eye,
  firm: Building2,
  vehicle: Car,
  location: MapPin,
  evidence: Fingerprint,
  incident: Siren,
  arrest: HatGlassesIcon,
};

export const ENTITY_RADII: Record<EntityType, number> = {
  case:       36,
  person:     24,
  caseEntity: 18,
  firm:       20,
  vehicle:    20,
  location:   20,
  evidence:   20,
  incident:   22,
  arrest:     22,
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
