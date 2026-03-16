/**
 * Dataverse data-fetching layer for the NEXUS Investigation Board.
 *
 *   IMPORTANT: Replace the `cr1da_` prefix below with your actual
 *   Dataverse publisher prefix. Check the column logical names in
 *   Power Apps Maker Portal → Tables → <Table> → Columns.
 *
 *   This module exports `fetchGraphData()` which accepts the PCF WebAPI
 *   and a caseId, queries all related entities, and maps them into the
 *   GraphData structure consumed by the D3 graph.
 *
 *   Usage inside the PCF wrapper:
 *   const data = await fetchGraphData(context.webAPI, caseId);
 *   root.render(<App graphData={data} />);
 */

import type { GraphData, GraphNode, GraphLink, EntityDetails } from '../types';
import { ENTITY_RADII } from '../utils/constants';

// ─────────────────────────────────────────────────────────────────────────────
//  Table & Column Logical Names (update prefix as needed)
// ─────────────────────────────────────────────────────────────────────────────

const TABLE = {
  case: 'cr1da_case',
  person: 'cr1da_person',
  caseEntity: 'cr1da_caseentity',
  evidence: 'cr1da_evidence',
} as const;

const COL = {
  // Case
  caseId: 'cr1da_caseid',
  caseName: 'cr1da_casename',
  caseNumber: 'cr1da_casenumber',
  openDate: 'cr1da_opendate',
  isActive: 'cr1da_isactive',
  // Person
  personId: 'cr1da_personid',
  personName: 'cr1da_personname',
  dateOfBirth: 'cr1da_dateofbirth',
  phoneNumber: 'cr1da_phonenumber',
  isSuspect: 'cr1da_issuspect',
  // Case Entity
  caseEntityId: 'cr1da_caseentityid',
  entityName: 'cr1da_entityname',
  entityType: 'cr1da_entitytype',
  ceCase: '_cr1da_case_value',       // lookup → Case
  cePerson: '_cr1da_person_value',     // lookup → Person
  // Evidence
  evidenceId: 'cr1da_evidenceid',
  evidenceName: 'cr1da_evidencename',
  evidenceType: 'cr1da_evidencetype',
  collectedDate: 'cr1da_collecteddate',
  evCase: '_cr1da_case_value',         // lookup → Case
  evCaseEntity: '_cr1da_caseentity_value',   // lookup → CaseEntity
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  WebAPI type (minimal subset of PCF's context.webAPI)
// ─────────────────────────────────────────────────────────────────────────────

export interface DataverseWebAPI {
  retrieveRecord(entityType: string, id: string, options?: string): Promise<any>;
  retrieveMultipleRecords(entityType: string, options?: string): Promise<{ entities: any[] }>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main fetch function
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchGraphData(
  webAPI: DataverseWebAPI,
  caseId: string
): Promise<GraphData> {
  // Run all queries in parallel
  const [caseRecord, caseEntities, evidence] = await Promise.all([
    // 1) The Case record itself
    webAPI.retrieveRecord(
      TABLE.case, caseId,
      `?$select=${COL.caseName},${COL.caseNumber},${COL.openDate},${COL.isActive}`
    ),
    // 2) All Case Entities linked to this case
    webAPI.retrieveMultipleRecords(
      TABLE.caseEntity,
      `?$select=${COL.entityName},${COL.entityType},${COL.cePerson}` +
      `&$filter=${COL.ceCase} eq '${caseId}'`
    ),
    // 3) All Evidence linked to this case
    webAPI.retrieveMultipleRecords(
      TABLE.evidence,
      `?$select=${COL.evidenceName},${COL.evidenceType},${COL.collectedDate},${COL.evCaseEntity}` +
      `&$filter=${COL.evCase} eq '${caseId}'`
    ),
  ]);

  // 4) Fetch Persons referenced by Case Entities
  const personIds = caseEntities.entities
    .map((e: any) => e[COL.cePerson])
    .filter(Boolean) as string[];

  let persons: { entities: any[] } = { entities: [] };
  if (personIds.length > 0) {
    const personFilter = personIds.map(id => `${COL.personId} eq '${id}'`).join(' or ');
    persons = await webAPI.retrieveMultipleRecords(
      TABLE.person,
      `?$select=${COL.personName},${COL.dateOfBirth},${COL.phoneNumber},${COL.isSuspect}` +
      `&$filter=${personFilter}`
    );
  }

  return mapToGraphData(caseId, caseRecord, caseEntities.entities, persons.entities, evidence.entities);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mapping helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(raw: string | null): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return raw;
  }
}

function mapToGraphData(
  caseId: string,
  caseRecord: any,
  caseEntities: any[],
  persons: any[],
  evidenceList: any[]
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // ── Case node (centre)
  nodes.push({
    id: caseId,
    type: 'case',
    label: caseRecord[COL.caseNumber] ?? 'Case',
    sublabel: caseRecord[COL.caseName] ?? '',
    radius: ENTITY_RADII.case,
    details: {
      kind: 'case',
      caseId,
      dvId: caseId,
      name: caseRecord[COL.caseName] ?? '',
      caseNumber: caseRecord[COL.caseNumber] ?? '',
      openDate: formatDate(caseRecord[COL.openDate]),
      isActive: caseRecord[COL.isActive] ?? true,
    },
  });

  // ── Person nodes
  const personMap = new Map<string, string>(); // dvId → nodeId
  persons.forEach(p => {
    const pid = p[COL.personId];
    personMap.set(pid, pid);
    const suspect = p[COL.isSuspect] ?? false;
    nodes.push({
      id: pid,
      type: 'person',
      label: p[COL.personName] ?? 'Unknown',
      sublabel: suspect ? 'Suspect' : 'Person',
      radius: ENTITY_RADII.person,
      details: {
        kind: 'person',
        personId: pid,
        dvId: pid,
        name: p[COL.personName] ?? '',
        dateOfBirth: formatDate(p[COL.dateOfBirth]),
        phoneNumber: p[COL.phoneNumber] ?? '—',
        isSuspect: suspect,
      },
    });
  });

  // ── Case Entity nodes + links
  caseEntities.forEach(ce => {
    const ceId = ce[COL.caseEntityId];
    nodes.push({
      id: ceId,
      type: 'caseEntity',
      label: ce[COL.entityName] ?? 'Entity',
      sublabel: ce[COL.entityType] ?? '',
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'caseEntity',
        caseEntityId: ceId,
        dvId: ceId,
        entityName: ce[COL.entityName] ?? '',
        entityType: ce[COL.entityType] ?? '',
        linkedCaseId: caseId,
        linkedPersonId: ce[COL.cePerson] ?? null,
      },
    });

    // Link: Case → CaseEntity
    links.push({ source: caseId, target: ceId, label: 'entity' });

    // Link: CaseEntity → Person (if linked)
    const linkedPerson = ce[COL.cePerson];
    if (linkedPerson && personMap.has(linkedPerson)) {
      links.push({
        source: ceId,
        target: linkedPerson,
        label: ce[COL.entityType]?.toLowerCase() ?? 'linked',
      });
    }
  });

  // ── Evidence nodes + links
  evidenceList.forEach(ev => {
    const evId = ev[COL.evidenceId];
    nodes.push({
      id: evId,
      type: 'evidence',
      label: ev[COL.evidenceName] ?? 'Evidence',
      sublabel: ev[COL.evidenceType] ?? '',
      radius: ENTITY_RADII.evidence,
      details: {
        kind: 'evidence',
        evidenceId: evId,
        dvId: evId,
        evidenceName: ev[COL.evidenceName] ?? '',
        evidenceType: ev[COL.evidenceType] ?? '',
        collectedDate: formatDate(ev[COL.collectedDate]),
        linkedCaseId: caseId,
        linkedCaseEntityId: ev[COL.evCaseEntity] ?? null,
      },
    });

    // Link: Case → Evidence
    links.push({ source: caseId, target: evId, label: 'evidence' });

    // Link: Evidence → CaseEntity (if linked)
    const linkedCE = ev[COL.evCaseEntity];
    if (linkedCE) {
      links.push({ source: evId, target: linkedCE, label: 'linked to' });
    }
  });

  return { nodes, links };
}
