// ─── Entity Types (aligned with Dataverse tables) ─────────────────────────────

export type EntityType = 'case' | 'person' | 'caseEntity' | 'firm' | 'vehicle' | 'location' | 'evidence' | 'incident' | 'arrest';

export interface TimelineEntry {
  event: string;
  timestamp: string;
}

// ─── UI Layout Types ────────────────────────────────────────────────────────

export interface CaseContext {
  caseId: string;
  caseName: string;
  caseType: string;
  status: string;
  priority: string;
  lead: string;
}

export interface RelatedCaseRef {
  id: string;
  name: string;
  matchReason: string;
  status: string;
}

export type LoadingStep = 'context' | 'contacts' | 'connections' | 'annotations' | 'related' | 'render';

// ─── Entity Detail Payloads ───────────────────────────────────────────────────

export interface CaseDetails {
  kind: 'case';
  caseId: string;
  dvId: string;
  name: string;
  caseNumber: string;
  openDate: string;
  closeDate?: string;
  priority?: string;
  status?: string;
  summary?: string;
  officerId?: string | null;
  isActive: boolean;
}

export interface PersonDetails {
  kind: 'person';
  personId: string;
  dvId: string;
  name: string;
  alias?: string;
  nricFin?: string;
  nationality?: string;
  dateOfBirth: string;
  phoneNumber: string;
  occupation?: string;
  riskLevel?: string;
  isSuspect: boolean;
}

export interface CaseEntityDetails {
  kind: 'caseEntity';
  caseEntityId: string;
  dvId: string;
  entityName: string;
  entityType: string;
  role?: string;
  involvementLevel?: string;
  addedDate?: string;
  notes?: string;
  linkedCaseId: string;
  linkedPersonId: string | null;
}

export interface FirmDetails {
  kind: 'firm';
  firmId: string;
  dvId: string;
  name: string;
  acraStatus: string;
  contact: string;
  ssicCode: string;
}

export interface VehicleDetails {
  kind: 'vehicle';
  vehicleId: string;
  dvId: string;
  name: string;
  plate: string;
  make: string;
  model: string;
  colour: string;
  year: string;
  vin: string;
  status: string;
}

export interface LocationDetails {
  kind: 'location';
  locationId: string;
  dvId: string;
  name: string;
  locationType: string;
  streetAddress: string;
  postalCode: string;
}

export interface OfficerDetails {
  kind: 'officer';
  officerId: string;
  dvId: string;
  name: string;
  badgeNumber: string;
  rank: string;
  department: string;
  division: string;
  contact: string;
  status: string;
}

export interface EvidenceDetails {
  kind: 'evidence';
  evidenceId: string;
  dvId: string;
  evidenceName: string;
  evidenceType: string;
  description?: string;
  evidenceFile?: string;
  officerId?: string | null;
  incidentId?: string | null;
  collectedDate: string;
  linkedCaseId: string;
  linkedCaseEntityId: string | null;
}

export interface IncidentDetails {
  kind: 'incident';
  incidentId: string;
  dvId: string;
  name: string;
  crimeType: string;
  description: string;
  severity: string;
  linkedCaseId: string;
  locationId: string | null;
  officerId: string | null;
}

export interface ArrestDetails {
  kind: 'arrest';
  arrestId: string;
  dvId: string;
  name: string;
  bailAmount: string;
  bailStatus: string;
  description: string;
  linkedCaseId: string;
  incidentId: string | null;
  officerId: string | null;
  personId: string | null;
}

export type EntityDetails =
  | CaseDetails
  | PersonDetails
  | CaseEntityDetails
  | FirmDetails
  | VehicleDetails
  | LocationDetails
  | OfficerDetails
  | EvidenceDetails
  | IncidentDetails
  | ArrestDetails;

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
