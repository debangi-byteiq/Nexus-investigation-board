import type { EntityType } from '../types';
import { Folder, User, Link, Paperclip, LucideProps } from 'lucide-react';
import { ElementType } from 'react';

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

export const ENTITY_ICONS: Record<EntityType, ElementType<LucideProps>> = {
  case: Folder,
  person: User,
  caseEntity: Link,
  evidence: Paperclip,
};

export const ENTITY_RADII: Record<EntityType, number> = {
  case:       36,
  person:     24,
  caseEntity: 18,
  evidence:   20,
};

export const SIDEBAR_WIDTH = 400;
