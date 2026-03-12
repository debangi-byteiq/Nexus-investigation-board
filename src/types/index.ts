// ─── Entity Types ─────────────────────────────────────────────────────────────

export type EntityType = 'case' | 'contact' | 'connection' | 'annotation' | 'related';

export interface TimelineEntry {
  event: string;
  timestamp: string;
}

export interface RelatedCaseRef {
  id: string;
  name: string;
  matchReason: string;
  status: 'Open' | 'Active' | 'Closed' | 'Cold';
}

// ─── Entity Detail Payloads ───────────────────────────────────────────────────

export interface CaseDetails {
  kind: 'case';
  caseId: string;
  dvId: string;
  name: string;
  status: string;
  priority: string;
  type: string;
  opened: string;
  lead: string;
  description: string;
  tags: string[];
  timeline: TimelineEntry[];
}

export interface ContactDetails {
  kind: 'contact';
  contactId: string;
  dvId: string;
  name: string;
  role: 'Suspect' | 'Victim' | 'Witness' | 'Person of Interest';
  status: string;
  dob: string;
  phone: string;
  address: string;
  occupation: string;
  priors?: string;
  note: string;
  tags: string[];
  timeline: TimelineEntry[];
  relatedCases: RelatedCaseRef[];
}

export interface ConnectionDetails {
  kind: 'connection';
  connectionId: string;
  dvId: string;
  name: string;
  from: string;
  to: string;
  relType: string;
  confirmedBy: string;
  since: string;
  status: string;
  note: string;
  tags: string[];
  timeline: TimelineEntry[];
  relatedCases: RelatedCaseRef[];
}

export interface AnnotationDetails {
  kind: 'annotation';
  annotationId: string;
  dvId: string;
  name: string;
  docType: string;
  createdBy: string;
  created: string;
  status: string;
  subject: string;
  note: string;
  tags: string[];
  timeline: TimelineEntry[];
  relatedCases: RelatedCaseRef[];
}

export interface RelatedCaseDetails {
  kind: 'related';
  caseId: string;
  dvId: string;
  name: string;
  linkType: string;
  confidence: string;
  status: string;
  closedDate: string | null;
  linkReason: string;
  overlap: string;
  tags: string[];
  timeline: TimelineEntry[];
  relatedCases: RelatedCaseRef[];
}

export type EntityDetails =
  | CaseDetails
  | ContactDetails
  | ConnectionDetails
  | AnnotationDetails
  | RelatedCaseDetails;

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

// ─── Case (host context) ─────────────────────────────────────────────────────

export interface CaseContext {
  caseId: string;
  caseName: string;
  caseType: string;
  status: 'Open' | 'Active' | 'Closed' | 'Cold';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  lead: string;
}

// ─── App State ────────────────────────────────────────────────────────────────

export type LoadingStep =
  | 'context'
  | 'contacts'
  | 'connections'
  | 'annotations'
  | 'related'
  | 'render'
  | 'done';

export interface AppState {
  loadingStep: LoadingStep;
  isLoaded: boolean;
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;
  activeFilters: Set<EntityType>;
  searchQuery: string;
  sidebarOpen: boolean;
}

// ─── D3 Transform ─────────────────────────────────────────────────────────────

export interface D3Transform {
  x: number;
  y: number;
  k: number;
}
