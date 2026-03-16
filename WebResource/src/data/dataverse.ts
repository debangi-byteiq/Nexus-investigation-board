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

import type { GraphData, GraphNode, GraphLink } from '../types';
import { ENTITY_RADII } from '../utils/constants';

declare global {
  interface Window {
    Xrm?: any;
  }
}

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

const CASE_ENTITY_CASE_LOOKUP_KEYS = [COL.ceCase, '_cr1da_caseid_value'];
const CASE_ENTITY_PERSON_LOOKUP_KEYS = [COL.cePerson, '_cr1da_personid_value', '_cr1da_contact_value'];
const EVIDENCE_CASE_LOOKUP_KEYS = [COL.evCase, '_cr1da_caseid_value'];
const EVIDENCE_CASE_ENTITY_LOOKUP_KEYS = [COL.evCaseEntity, '_cr1da_caseentityid_value'];

const lookupKeyCache = new Map<string, string | null>();

// ─────────────────────────────────────────────────────────────────────────────
//  WebAPI type (minimal subset of PCF's context.webAPI)
// ─────────────────────────────────────────────────────────────────────────────

export interface DataverseWebAPI {
  retrieveRecord(entityType: string, id: string, options?: string): Promise<any>;
  retrieveMultipleRecords(entityType: string, options?: string): Promise<any>;
}

function getDataverseClientUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.parent?.Xrm?.Utility?.getGlobalContext?.().getClientUrl?.() ?? window.location.origin ?? null;
}

async function fetchDataverseJson(path: string): Promise<any> {
  const clientUrl = getDataverseClientUrl();
  if (!clientUrl) {
    throw new Error('Dataverse client URL is not available.');
  }

  const response = await fetch(`${clientUrl}${path}`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Metadata query failed with status ${response.status}`);
  }

  return response.json();
}

async function discoverLookupValueKey(
  referencingEntity: string,
  referencedEntity: string,
  fallbackKeys: string[]
): Promise<string[]> {
  const cacheKey = `${referencingEntity}->${referencedEntity}`;
  if (lookupKeyCache.has(cacheKey)) {
    const cached = lookupKeyCache.get(cacheKey);
    return cached ? [cached, ...fallbackKeys.filter(key => key !== cached)] : fallbackKeys;
  }

  try {
    const metadata = await fetchDataverseJson(
      `/api/data/v9.2/RelationshipDefinitions/Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata` +
      `?$select=ReferencingAttribute` +
      `&$filter=ReferencingEntity eq '${referencingEntity}' and ReferencedEntity eq '${referencedEntity}'`
    );

    const referencingAttribute = metadata?.value?.[0]?.ReferencingAttribute;
    if (typeof referencingAttribute === 'string' && referencingAttribute.length > 0) {
      const discoveredKey = `_${referencingAttribute}_value`;
      lookupKeyCache.set(cacheKey, discoveredKey);
      return [discoveredKey, ...fallbackKeys.filter(key => key !== discoveredKey)];
    }
  } catch (err) {
    console.warn(`Could not discover lookup key for ${cacheKey}. Using fallbacks.`, err);
  }

  lookupKeyCache.set(cacheKey, null);
  return fallbackKeys;
}

function getFirstStringValue(record: any, keys: string[]): string | null {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

async function retrieveMultipleWithFallback(
  webAPI: DataverseWebAPI,
  entityType: string,
  selectSets: string[][],
  filterColumns: string[],
  filterValue: string
): Promise<{ entities: any[] }> {
  let lastError: unknown;

  for (const filterCol of filterColumns) {
    for (const selectCols of selectSets) {
      const options =
        `?$select=${selectCols.join(',')}` +
        `&$filter=${filterCol} eq '${filterValue}'`;

      try {
        const result = await webAPI.retrieveMultipleRecords(entityType, options);
        return { entities: result?.entities ?? [] };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main fetch function
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchGraphData(
  webAPI: DataverseWebAPI,
  caseId: string
): Promise<GraphData> {
  const [caseEntityCaseLookupKeys, caseEntityPersonLookupKeys, evidenceCaseLookupKeys, evidenceCaseEntityLookupKeys] = await Promise.all([
    discoverLookupValueKey(TABLE.caseEntity, TABLE.case, CASE_ENTITY_CASE_LOOKUP_KEYS),
    discoverLookupValueKey(TABLE.caseEntity, TABLE.person, CASE_ENTITY_PERSON_LOOKUP_KEYS),
    discoverLookupValueKey(TABLE.evidence, TABLE.case, EVIDENCE_CASE_LOOKUP_KEYS),
    discoverLookupValueKey(TABLE.evidence, TABLE.caseEntity, EVIDENCE_CASE_ENTITY_LOOKUP_KEYS),
  ]);

  // Run all queries in parallel
  const [caseRecord, caseEntities, evidence] = await Promise.all([
    // 1) The Case record itself
    webAPI.retrieveRecord(
      TABLE.case, caseId,
      `?$select=${COL.caseName},${COL.caseNumber},${COL.openDate},${COL.isActive}`
    ),
    // 2) All Case Entities linked to this case
    retrieveMultipleWithFallback(
      webAPI,
      TABLE.caseEntity,
      [
        [COL.caseEntityId, COL.entityName, COL.entityType, ...caseEntityPersonLookupKeys],
        [COL.caseEntityId, COL.entityName, COL.entityType],
      ],
      caseEntityCaseLookupKeys,
      caseId
    ),
    // 3) All Evidence linked to this case
    retrieveMultipleWithFallback(
      webAPI,
      TABLE.evidence,
      [
        [COL.evidenceId, COL.evidenceName, COL.evidenceType, COL.collectedDate, ...evidenceCaseEntityLookupKeys],
        [COL.evidenceId, COL.evidenceName, COL.evidenceType, COL.collectedDate],
      ],
      evidenceCaseLookupKeys,
      caseId
    ),
  ]);

  // 4) Fetch Persons referenced by Case Entities
  const personIds = [...new Set(
    caseEntities.entities
      .map((e: any) => getFirstStringValue(e, caseEntityPersonLookupKeys))
      .filter(Boolean) as string[]
  )];

  let persons: { entities: any[] } = { entities: [] };
  if (personIds.length > 0) {
    const personFilter = personIds.map(id => `${COL.personId} eq '${id}'`).join(' or ');
    try {
      persons = await webAPI.retrieveMultipleRecords(
        TABLE.person,
        `?$select=${COL.personId},${COL.personName},${COL.dateOfBirth},${COL.phoneNumber},${COL.isSuspect}` +
        `&$filter=${personFilter}`
      );
    } catch (err) {
      // Keep graph usable even when person schema differs.
      console.warn('Person lookup query failed. Continuing without person nodes.', err);
      persons = { entities: [] };
    }
  }

  return mapToGraphData(
    caseId,
    caseRecord,
    caseEntities.entities,
    persons.entities,
    evidence.entities,
    caseEntityPersonLookupKeys,
    evidenceCaseEntityLookupKeys
  );
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
  evidenceList: any[],
  caseEntityPersonLookupKeys: string[],
  evidenceCaseEntityLookupKeys: string[]
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
  persons.forEach((p, index) => {
    const pid = p[COL.personId] ?? `person-${index + 1}`;
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
  caseEntities.forEach((ce, index) => {
    const ceId = ce[COL.caseEntityId] ?? `case-entity-${index + 1}`;
    const linkedPersonId = getFirstStringValue(ce, caseEntityPersonLookupKeys);
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
        linkedPersonId,
      },
    });

    // Link: Case → CaseEntity
    links.push({ source: caseId, target: ceId, label: 'entity' });

    // Link: CaseEntity → Person (if linked)
    const linkedPerson = linkedPersonId;
    if (linkedPerson && personMap.has(linkedPerson)) {
      links.push({
        source: ceId,
        target: linkedPerson,
        label: ce[COL.entityType]?.toLowerCase() ?? 'linked',
      });
    }
  });

  // ── Evidence nodes + links
  evidenceList.forEach((ev, index) => {
    const evId = ev[COL.evidenceId] ?? `evidence-${index + 1}`;
    const linkedCaseEntityId = getFirstStringValue(ev, evidenceCaseEntityLookupKeys);
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
        linkedCaseEntityId,
      },
    });

    // Link: Case → Evidence
    links.push({ source: caseId, target: evId, label: 'evidence' });

    // Link: Evidence → CaseEntity (if linked)
    const linkedCE = linkedCaseEntityId;
    if (linkedCE) {
      links.push({ source: evId, target: linkedCE, label: 'linked to' });
    }
  });

  return { nodes, links };
}
