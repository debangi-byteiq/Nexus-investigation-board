// ─── Entity Types (aligned with Dataverse tables) ─────────────────────────────

export type EntityType = 'case' | 'person' | 'caseEntity' | 'evidence';

export interface TimelineEntry {
  event: string;
  timestamp: string;
}

// ─── Entity Detail Payloads ───────────────────────────────────────────────────

export interface CaseDetails {
  kind: 'case';
  caseId: string;
  dvId: string;
  name: string;
  caseNumber: string;
  openDate: string;
  isActive: boolean;
}

export interface PersonDetails {
  kind: 'person';
  personId: string;
  dvId: string;
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  isSuspect: boolean;
}

export interface CaseEntityDetails {
  kind: 'caseEntity';
  caseEntityId: string;
  dvId: string;
  entityName: string;
  entityType: string;
  linkedCaseId: string;
  linkedPersonId: string | null;
}

export interface EvidenceDetails {
  kind: 'evidence';
  evidenceId: string;
  dvId: string;
  evidenceName: string;
  evidenceType: string;
  collectedDate: string;
  linkedCaseId: string;
  linkedCaseEntityId: string | null;
}

export type EntityDetails =
  | CaseDetails
  | PersonDetails
  | CaseEntityDetails
  | EvidenceDetails;

// ─── Graph Node & Link ────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  sublabel: string;
  radius: number;
  details: EntityDetails;
  // D3 simulation fields (mutable)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── D3 Transform ─────────────────────────────────────────────────────────────

export interface D3Transform {
  x: number;
  y: number;
  k: number;
}
