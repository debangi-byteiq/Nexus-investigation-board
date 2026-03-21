import type { GraphData, GraphNode, GraphLink } from '../types';
import { ENTITY_RADII } from '../utils/constants';

// Dataverse table logical names (updated schema)
const TABLE = {
  case: ['cr1da_cas1', 'cr1da_case1'],
  caseEntity: ['cr1da_caseentity1'],
  evidence: ['cr1da_evidence'],
  firm: ['cr1da_firm'],
  location: ['cr1da_location'],
  officer: ['cr1da_officer'],
  person: ['cr1da_person1'],
  vehicle: ['cr1da_vehicle'],
} as const;

// Only custom columns (cr1da_*) and custom lookup value keys (_cr1da_*_value)
const COL = {
  case: {
    id: ['cr1da_case1id'],
    name: 'cr1da_casename',
    openDate: 'cr1da_opendate',
    priority: 'cr1da_priority',
    status: 'cr1da_status',
    summary: 'cr1da_summary',
    officerLookup: [] as const,
    locationLookup: [] as const,
  },
  caseEntity: {
    id: ['cr1da_caseentity1id'],
    name: 'cr1da_caseentityname',
    entityType: 'cr1da_entitytype',
    role: 'cr1da_role',
    involvementLevel: 'cr1da_involvementlevel',
    notes: 'cr1da_notes',
    caseLookup: ['_cr1da_caseid_value', '_cr1da_case1id_value'],
    personLookup: ['_cr1da_personid_value'],
    firmLookup: ['_cr1da_firmid_value'],
    vehicleLookup: ['_cr1da_vehicleid_value'],
  },
  evidence: {
    id: ['cr1da_evidenceid'],
    name: 'cr1da_evidencename',
    category: 'cr1da_evidencecategory',
    description: 'cr1da_evidencedescription',
    caseLookup: ['_cr1da_caseid_value', '_cr1da_case1id_value'],
    officerLookup: ['_cr1da_officerid_value'],
    incidentLookup: ['_cr1da_incidentid_value'],
  },
  person: {
    id: ['cr1da_person1id'],
    name: 'cr1da_personname',
    alias: 'cr1da_alias',
    dob: 'cr1da_dob',
    occupation: 'cr1da_occupation',
    contact: 'cr1da_contact',
    riskLevel: 'cr1da_risklevel',
  },
  firm: {
    id: ['cr1da_firmid'],
    name: 'cr1da_firmname',
    contact: 'cr1da_contact',
    ssic: 'cr1da_ssiccode',
  },
  vehicle: {
    id: ['cr1da_vehicleid'],
    name: 'cr1da_vehiclename',
    plate: 'cr1da_licenseplate',
    make: 'cr1da_make',
    model: 'cr1da_model',
    year: 'cr1da_year',
  },
  location: {
    id: ['cr1da_locationid'],
    name: 'cr1da_locationname',
    type: 'cr1da_locationtype',
    street: 'cr1da_streetaddress',
    postal: 'cr1da_postalcode',
  },
  officer: {
    id: ['cr1da_officerid'],
    name: 'cr1da_officername',
    badge: 'cr1da_badgenumber',
    rank: 'cr1da_rank',
    department: 'cr1da_department',
  },
} as const;

export interface DataverseWebAPI {
  retrieveRecord(entityType: string, id: string, options?: string): Promise<any>;
  retrieveMultipleRecords(entityType: string, options?: string): Promise<any>;
}

function getFirstStringValue(record: any, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function customColumns(cols: readonly string[]): string[] {
  return cols.filter(c => c.startsWith('cr1da_') || c.startsWith('_cr1da_'));
}

function narrowSelectForKey(
  selectCols: readonly string[],
  keyGroup: readonly string[],
  activeKey: string
): string[] {
  return customColumns(selectCols).filter(c => !keyGroup.includes(c) || c === activeKey);
}

function escapeODataValue(value: string): string {
  return value.replace(/'/g, "''");
}

async function retrieveRecordWithEntityAndSelectFallback(
  webAPI: DataverseWebAPI,
  entityCandidates: readonly string[],
  id: string,
  selectSets: readonly (readonly string[])[]
): Promise<{ entity: string; record: any }> {
  let lastError: unknown;

  for (const entity of entityCandidates) {
    for (const selectCols of selectSets) {
      const selected = customColumns(selectCols);
      if (selected.length === 0) continue;

      const options = `?$select=${selected.join(',')}`;
      try {
        const record = await webAPI.retrieveRecord(entity, id, options);
        return { entity, record };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError;
}

async function retrieveMultipleByCaseLookup(
  webAPI: DataverseWebAPI,
  entityCandidates: readonly string[],
  selectCols: readonly string[],
  caseLookupKeys: readonly string[],
  caseId: string
): Promise<{ entity: string; entities: any[] }> {
  let lastError: unknown;

  for (const entity of entityCandidates) {
    for (const lookupKey of caseLookupKeys) {
      const narrowedSelect = narrowSelectForKey(selectCols, caseLookupKeys, lookupKey);
      const options =
        `?$select=${narrowedSelect.join(',')}` +
        `&$filter=${lookupKey} eq '${escapeODataValue(caseId)}'`;
      try {
        const result = await webAPI.retrieveMultipleRecords(entity, options);
        return { entity, entities: result?.entities ?? [] };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError;
}

async function retrieveMultipleByIds(
  webAPI: DataverseWebAPI,
  entityCandidates: readonly string[],
  idKeys: readonly string[],
  selectCols: readonly string[],
  ids: readonly string[]
): Promise<{ entity: string; entities: any[] }> {
  if (ids.length === 0) {
    return { entity: entityCandidates[0], entities: [] };
  }

  const uniqueIds = [...new Set(ids)].filter(Boolean);
  let lastError: unknown;

  for (const entity of entityCandidates) {
    for (const idKey of idKeys) {
      const narrowedSelect = narrowSelectForKey(selectCols, idKeys, idKey);
      const filter = uniqueIds
        .map(id => `${idKey} eq '${escapeODataValue(id)}'`)
        .join(' or ');

      const options =
        `?$select=${narrowedSelect.join(',')}` +
        `&$filter=${filter}`;

      try {
        const result = await webAPI.retrieveMultipleRecords(entity, options);
        return { entity, entities: result?.entities ?? [] };
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
  const caseCoreCols = [
    COL.case.name,
    COL.case.openDate,
    COL.case.priority,
    COL.case.status,
    COL.case.summary,
  ] as const;

  const caseResult = await retrieveRecordWithEntityAndSelectFallback(
    webAPI,
    TABLE.case,
    caseId,
    [
      [...caseCoreCols, ...COL.case.officerLookup, ...COL.case.locationLookup],
      [...caseCoreCols, ...COL.case.officerLookup],
      [...caseCoreCols, ...COL.case.locationLookup],
      [...caseCoreCols],
      [COL.case.name, COL.case.status, COL.case.summary],
      [COL.case.name],
    ]
  );

  const [caseEntitiesResult, evidenceResult] = await Promise.all([
    retrieveMultipleByCaseLookup(
      webAPI,
      TABLE.caseEntity,
      [
        ...COL.caseEntity.id,
        COL.caseEntity.name,
        COL.caseEntity.entityType,
        COL.caseEntity.role,
        COL.caseEntity.involvementLevel,
        COL.caseEntity.notes,
        ...COL.caseEntity.caseLookup,
        ...COL.caseEntity.personLookup,
        ...COL.caseEntity.firmLookup,
        ...COL.caseEntity.vehicleLookup,
      ],
      COL.caseEntity.caseLookup,
      caseId
    ),
    retrieveMultipleByCaseLookup(
      webAPI,
      TABLE.evidence,
      [
        ...COL.evidence.id,
        COL.evidence.name,
        COL.evidence.category,
        COL.evidence.description,
        ...COL.evidence.caseLookup,
        ...COL.evidence.officerLookup,
        ...COL.evidence.incidentLookup,
      ],
      COL.evidence.caseLookup,
      caseId
    ),
  ]);

  const caseEntities = caseEntitiesResult.entities;
  const evidence = evidenceResult.entities;

  const personIds: string[] = [];
  const firmIds: string[] = [];
  const vehicleIds: string[] = [];

  // Extract Person/Firm/Vehicle IDs from CaseEntity records
  caseEntities.forEach((ce: any) => {
    const personId = getFirstStringValue(ce, COL.caseEntity.personLookup);
    if (personId) personIds.push(personId);
    const firmId = getFirstStringValue(ce, COL.caseEntity.firmLookup);
    if (firmId) firmIds.push(firmId);
    const vehicleId = getFirstStringValue(ce, COL.caseEntity.vehicleLookup);
    if (vehicleId) vehicleIds.push(vehicleId);
  });

  const caseOfficerIds = [getFirstStringValue(caseResult.record, COL.case.officerLookup)].filter(Boolean) as string[];
  const evidenceOfficerIds = evidence
    .map((ev: any) => getFirstStringValue(ev, COL.evidence.officerLookup))
    .filter(Boolean) as string[];
  const officerIds = [...new Set([...caseOfficerIds, ...evidenceOfficerIds])];

  const locationIds = [getFirstStringValue(caseResult.record, COL.case.locationLookup)].filter(Boolean) as string[];

  const [personsResult, firmsResult, vehiclesResult, officersResult, locationsResult] = await Promise.all([
    retrieveMultipleByIds(
      webAPI,
      TABLE.person,
      COL.person.id,
      [...COL.person.id, COL.person.name, COL.person.alias, COL.person.dob, COL.person.occupation, COL.person.contact, COL.person.riskLevel],
      personIds
    ).catch(() => ({ entity: TABLE.person[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.firm,
      COL.firm.id,
      [...COL.firm.id, COL.firm.name, COL.firm.contact, COL.firm.ssic],
      firmIds
    ).catch(() => ({ entity: TABLE.firm[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.vehicle,
      COL.vehicle.id,
      [...COL.vehicle.id, COL.vehicle.name, COL.vehicle.plate, COL.vehicle.make, COL.vehicle.model, COL.vehicle.year],
      vehicleIds
    ).catch(() => ({ entity: TABLE.vehicle[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.officer,
      COL.officer.id,
      [...COL.officer.id, COL.officer.name, COL.officer.badge, COL.officer.rank, COL.officer.department],
      officerIds
    ).catch(() => ({ entity: TABLE.officer[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.location,
      COL.location.id,
      [...COL.location.id, COL.location.name, COL.location.type, COL.location.street, COL.location.postal],
      locationIds
    ).catch(() => ({ entity: TABLE.location[0], entities: [] })),
  ]);

  return mapToGraphData(
    caseId,
    caseResult.record,
    caseEntities,
    personsResult.entities,
    evidence,
    firmsResult.entities,
    vehiclesResult.entities,
    officersResult.entities,
    locationsResult.entities
  );
}

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
  firms: any[],
  vehicles: any[],
  officers: any[],
  locations: any[]
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeById = new Set<string>();

  function pushNode(node: GraphNode): void {
    if (nodeById.has(node.id)) return;
    nodeById.add(node.id);
    nodes.push(node);
  }

  function pushLink(source: string, target: string, label: string): void {
    if (!source || !target) return;
    links.push({ source, target, label });
  }

  const personNodeByDvId = new Map<string, string>();
  const caseEntityNodeByDvId = new Map<string, string>();
  const firmNodeByDvId = new Map<string, string>();
  const vehicleNodeByDvId = new Map<string, string>();
  const officerNodeByDvId = new Map<string, string>();
  const locationNodeByDvId = new Map<string, string>();

  const caseIdFromRecord = getFirstStringValue(caseRecord, COL.case.id) ?? caseId;

  pushNode({
    id: caseId,
    type: 'case',
    label: caseRecord[COL.case.name] ?? 'Case',
    sublabel: caseRecord[COL.case.summary] ?? '',
    radius: ENTITY_RADII.case,
    details: {
      kind: 'case',
      caseId,
      dvId: caseIdFromRecord,
      name: caseRecord[COL.case.name] ?? '',
      caseNumber: caseRecord[COL.case.name] ?? '',
      openDate: formatDate(caseRecord[COL.case.openDate] ?? null),
      isActive: true,
    },
  });

  persons.forEach((p, index) => {
    const dvId = getFirstStringValue(p, COL.person.id) ?? `person-${index + 1}`;
    const nodeId = `person:${dvId}`;
    personNodeByDvId.set(dvId, nodeId);
    pushNode({
      id: nodeId,
      type: 'person',
      label: p[COL.person.name] ?? 'Person',
      sublabel: p[COL.person.riskLevel] ?? 'Person',
      radius: ENTITY_RADII.person,
      details: {
        kind: 'person',
        personId: dvId,
        dvId,
        name: p[COL.person.name] ?? '',
        dateOfBirth: formatDate(p[COL.person.dob]),
        phoneNumber: p[COL.person.contact] ?? '—',
        isSuspect: false,
      },
    });
  });

  firms.forEach((f, index) => {
    const dvId = getFirstStringValue(f, COL.firm.id) ?? `firm-${index + 1}`;
    const nodeId = `firm:${dvId}`;
    firmNodeByDvId.set(dvId, nodeId);
    pushNode({
      id: nodeId,
      type: 'firm',
      label: f[COL.firm.name] ?? 'Firm',
      sublabel: 'Firm',
      radius: ENTITY_RADII.firm,
      details: {
        kind: 'caseEntity',
        caseEntityId: dvId,
        dvId,
        entityName: f[COL.firm.name] ?? 'Firm',
        entityType: 'Firm',
        linkedCaseId: caseId,
        linkedPersonId: null,
      },
    });
  });

  vehicles.forEach((v, index) => {
    const dvId = getFirstStringValue(v, COL.vehicle.id) ?? `vehicle-${index + 1}`;
    const nodeId = `vehicle:${dvId}`;
    vehicleNodeByDvId.set(dvId, nodeId);
    pushNode({
      id: nodeId,
      type: 'vehicle',
      label: v[COL.vehicle.name] ?? v[COL.vehicle.plate] ?? 'Vehicle',
      sublabel: 'Vehicle',
      radius: ENTITY_RADII.vehicle,
      details: {
        kind: 'caseEntity',
        caseEntityId: dvId,
        dvId,
        entityName: v[COL.vehicle.name] ?? 'Vehicle',
        entityType: 'Vehicle',
        linkedCaseId: caseId,
        linkedPersonId: null,
      },
    });
  });

  officers.forEach((o, index) => {
    const dvId = getFirstStringValue(o, COL.officer.id) ?? `officer-${index + 1}`;
    const nodeId = `officer:${dvId}`;
    officerNodeByDvId.set(dvId, nodeId);
    pushNode({
      id: nodeId,
      type: 'caseEntity',
      label: o[COL.officer.name] ?? 'Officer',
      sublabel: 'Officer',
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'caseEntity',
        caseEntityId: dvId,
        dvId,
        entityName: o[COL.officer.name] ?? 'Officer',
        entityType: 'Officer',
        linkedCaseId: caseId,
        linkedPersonId: null,
      },
    });
  });

  locations.forEach((l, index) => {
    const dvId = getFirstStringValue(l, COL.location.id) ?? `location-${index + 1}`;
    const nodeId = `location:${dvId}`;
    locationNodeByDvId.set(dvId, nodeId);
    pushNode({
      id: nodeId,
      type: 'location',
      label: l[COL.location.name] ?? 'Location',
      sublabel: 'Location',
      radius: ENTITY_RADII.location,
      details: {
        kind: 'caseEntity',
        caseEntityId: dvId,
        dvId,
        entityName: l[COL.location.name] ?? 'Location',
        entityType: 'Location',
        linkedCaseId: caseId,
        linkedPersonId: null,
      },
    });
  });

  caseEntities.forEach((ce, index) => {
    const dvId = getFirstStringValue(ce, COL.caseEntity.id) ?? `case-entity-${index + 1}`;
    const nodeId = `ce:${dvId}`;
    caseEntityNodeByDvId.set(dvId, nodeId);
    const personDvId = getFirstStringValue(ce, COL.caseEntity.personLookup);

    pushNode({
      id: nodeId,
      type: 'caseEntity',
      label: ce[COL.caseEntity.name] ?? 'Case Entity',
      sublabel: ce[COL.caseEntity.entityType] ?? 'Entity',
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'caseEntity',
        caseEntityId: dvId,
        dvId,
        entityName: ce[COL.caseEntity.name] ?? 'Case Entity',
        entityType: ce[COL.caseEntity.entityType] ?? 'Entity',
        linkedCaseId: caseId,
        linkedPersonId: personDvId,
      },
    });

    pushLink(caseId, nodeId, 'entity');

    if (personDvId && personNodeByDvId.has(personDvId)) {
      pushLink(nodeId, personNodeByDvId.get(personDvId)!, ce[COL.caseEntity.role] ?? 'linked');
    }

    const firmDvId = getFirstStringValue(ce, COL.caseEntity.firmLookup);
    if (firmDvId && firmNodeByDvId.has(firmDvId)) {
      pushLink(nodeId, firmNodeByDvId.get(firmDvId)!, 'firm');
    }

    const vehicleDvId = getFirstStringValue(ce, COL.caseEntity.vehicleLookup);
    if (vehicleDvId && vehicleNodeByDvId.has(vehicleDvId)) {
      pushLink(nodeId, vehicleNodeByDvId.get(vehicleDvId)!, 'vehicle');
    }
  });

  const caseOfficerId = getFirstStringValue(caseRecord, COL.case.officerLookup);
  if (caseOfficerId && officerNodeByDvId.has(caseOfficerId)) {
    pushLink(caseId, officerNodeByDvId.get(caseOfficerId)!, 'officer');
  }

  const caseLocationId = getFirstStringValue(caseRecord, COL.case.locationLookup);
  if (caseLocationId && locationNodeByDvId.has(caseLocationId)) {
    pushLink(caseId, locationNodeByDvId.get(caseLocationId)!, 'location');
  }

  evidenceList.forEach((ev, index) => {
    const dvId = getFirstStringValue(ev, COL.evidence.id) ?? `evidence-${index + 1}`;
    const nodeId = `evidence:${dvId}`;
    pushNode({
      id: nodeId,
      type: 'evidence',
      label: ev[COL.evidence.name] ?? 'Evidence',
      sublabel: ev[COL.evidence.category] ?? '',
      radius: ENTITY_RADII.evidence,
      details: {
        kind: 'evidence',
        evidenceId: dvId,
        dvId,
        evidenceName: ev[COL.evidence.name] ?? '',
        evidenceType: ev[COL.evidence.category] ?? '',
        collectedDate: '—',
        linkedCaseId: caseId,
        linkedCaseEntityId: null,
      },
    });

    pushLink(caseId, nodeId, 'evidence');

    const officerDvId = getFirstStringValue(ev, COL.evidence.officerLookup);
    if (officerDvId && officerNodeByDvId.has(officerDvId)) {
      pushLink(nodeId, officerNodeByDvId.get(officerDvId)!, 'handled by');
    }
  });

  return { nodes, links };
}
