import type { GraphData, GraphNode, GraphLink } from '../types';
import { ENTITY_RADII } from '../utils/constants';

// Dataverse table logical names (updated schema)
const TABLE = {
  case: ['cr1da_cas1', 'cr1da_case1'],
  caseEntity: ['cr1da_caseentity1'],
  evidence: ['cr1da_evidence'],
  incident: ['cr1da_incident', 'cr1da_incident1'],
  arrest: ['cr1da_arrest'],
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
    closeDate: 'cr1da_closedate',
    priority: 'cr1da_priority',
    status: 'cr1da_status',
    summary: 'cr1da_summary',
    officerLookup: ['_cr1da_officerid_value'],
    locationLookup: [] as const,
  },
  caseEntity: {
    id: ['cr1da_caseentity1id'],
    name: 'cr1da_caseentityname',
    entityType: 'cr1da_entitytype',
    role: 'cr1da_role',
    involvementLevel: 'cr1da_involvementlevel',
    addedDate: 'cr1da_addeddate',
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
  incident: {
    id: ['cr1da_incidentid', 'cr1da_incident1id'],
    name: 'cr1da_incidentname',
    crimeType: 'cr1da_crimetype',
    description: 'cr1da_description',
    severity: 'cr1da_severity',
    caseLookup: ['_cr1da_caseid_value', '_cr1da_case1id_value'],
    locationLookup: ['_cr1da_locationid_value'],
    officerLookup: ['_cr1da_officerid_value'],
  },
  arrest: {
    id: ['cr1da_arrestid'],
    name: 'cr1da_arrestname',
    bailAmount: 'cr1da_bailamount',
    bailStatus: 'cr1da_bailstatus',
    description: 'cr1da_description',
    caseLookup: ['_cr1da_caseid_value', '_cr1da_case1id_value'],
    incidentLookup: ['_cr1da_incidentid_value'],
    officerLookup: ['_cr1da_officerid_value'],
    personLookup: ['_cr1da_personid_value'],
  },
  person: {
    id: ['cr1da_person1id'],
    name: 'cr1da_personname',
    nricFin: 'cr1da_nricfin',
    nationality: 'cr1da_nartionality',
    alias: 'cr1da_alias',
    dob: 'cr1da_dob',
    occupation: 'cr1da_occupation',
    contact: 'cr1da_contact',
    riskLevel: 'cr1da_risklevel',
  },
  firm: {
    id: ['cr1da_firmid'],
    name: 'cr1da_firmname',
    acraStatus: 'cr1da_acrastatus',
    contact: 'cr1da_contact',
    ssic: 'cr1da_ssiccode',
  },
  vehicle: {
    id: ['cr1da_vehicleid'],
    name: 'cr1da_vehiclename',
    plate: 'cr1da_licenseplate',
    make: 'cr1da_make',
    model: 'cr1da_model',
    colour: 'cr1da_colour',
    year: 'cr1da_year',
    vin: 'cr1da_vin',
    status: 'cr1da_status',
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
    division: 'cr1da_division',
    contact: 'cr1da_contact',
    status: 'cr1da_status',
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

function getChoiceDisplayValue(record: any, key: string): string {
  const formatted = record?.[`${key}@OData.Community.Display.V1.FormattedValue`];
  if (typeof formatted === 'string' && formatted.trim().length > 0) {
    return formatted;
  }

  const raw = record?.[key];
  if (raw === null || raw === undefined || raw === '') {
    return '—';
  }

  return String(raw);
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

async function retrieveMultipleByCaseLookupWithSelectFallback(
  webAPI: DataverseWebAPI,
  entityCandidates: readonly string[],
  selectSets: readonly (readonly string[])[],
  caseLookupKeys: readonly string[],
  caseId: string
): Promise<{ entity: string; entities: any[] }> {
  let lastError: unknown;

  for (const entity of entityCandidates) {
    for (const lookupKey of caseLookupKeys) {
      for (const selectCols of selectSets) {
        const narrowedSelect = narrowSelectForKey(selectCols, caseLookupKeys, lookupKey);
        const selected = customColumns(narrowedSelect);
        if (selected.length === 0) continue;

        const options =
          `?$select=${selected.join(',')}` +
          `&$filter=${lookupKey} eq '${escapeODataValue(caseId)}'`;

        try {
          const result = await webAPI.retrieveMultipleRecords(entity, options);
          return { entity, entities: result?.entities ?? [] };
        } catch (err) {
          lastError = err;
        }
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
    COL.case.closeDate,
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

  const [caseEntitiesResult, evidenceResult, incidentsResult, arrestsResult] = await Promise.all([
    retrieveMultipleByCaseLookup(
      webAPI,
      TABLE.caseEntity,
      [
        ...COL.caseEntity.id,
        COL.caseEntity.name,
        COL.caseEntity.entityType,
        COL.caseEntity.role,
        COL.caseEntity.involvementLevel,
        COL.caseEntity.addedDate,
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
    retrieveMultipleByCaseLookupWithSelectFallback(
      webAPI,
      TABLE.incident,
      [
        [
          COL.incident.id[0],
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
          ...COL.incident.locationLookup,
          ...COL.incident.officerLookup,
        ],
        [
          COL.incident.id[0],
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
          ...COL.incident.locationLookup,
        ],
        [
          COL.incident.id[0],
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
        ],
        [
          COL.incident.id[1],
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
          ...COL.incident.locationLookup,
          ...COL.incident.officerLookup,
        ],
        [
          COL.incident.id[1],
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
          ...COL.incident.locationLookup,
        ],
        [
          COL.incident.id[1],
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
        ],
        [
          COL.incident.name,
          COL.incident.crimeType,
          COL.incident.description,
          COL.incident.severity,
          ...COL.incident.caseLookup,
          ...COL.incident.locationLookup,
          ...COL.incident.officerLookup,
        ],
      ],
      COL.incident.caseLookup,
      caseId
    ).catch(() => ({ entity: TABLE.incident[0], entities: [] })),
    retrieveMultipleByCaseLookup(
      webAPI,
      TABLE.arrest,
      [
        ...COL.arrest.id,
        COL.arrest.name,
        COL.arrest.bailAmount,
        COL.arrest.bailStatus,
        COL.arrest.description,
        ...COL.arrest.caseLookup,
        ...COL.arrest.incidentLookup,
        ...COL.arrest.officerLookup,
        ...COL.arrest.personLookup,
      ],
      COL.arrest.caseLookup,
      caseId
    ).catch(() => ({ entity: TABLE.arrest[0], entities: [] })),
  ]);

  const caseEntities = caseEntitiesResult.entities;
  const evidence = evidenceResult.entities;
  const incidents = incidentsResult.entities;
  const arrests = arrestsResult.entities;

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

  arrests.forEach((ar: any) => {
    const personId = getFirstStringValue(ar, COL.arrest.personLookup);
    if (personId) personIds.push(personId);
  });

  const caseOfficerIds = [getFirstStringValue(caseResult.record, COL.case.officerLookup)].filter(Boolean) as string[];
  const evidenceOfficerIds = evidence
    .map((ev: any) => getFirstStringValue(ev, COL.evidence.officerLookup))
    .filter(Boolean) as string[];
  const incidentOfficerIds = incidents
    .map((inc: any) => getFirstStringValue(inc, COL.incident.officerLookup))
    .filter(Boolean) as string[];
  const arrestOfficerIds = arrests
    .map((ar: any) => getFirstStringValue(ar, COL.arrest.officerLookup))
    .filter(Boolean) as string[];
  const officerIds = [...new Set([...caseOfficerIds, ...evidenceOfficerIds, ...incidentOfficerIds, ...arrestOfficerIds])];

  const caseLocationIds = [getFirstStringValue(caseResult.record, COL.case.locationLookup)].filter(Boolean) as string[];
  const incidentLocationIds = incidents
    .map((inc: any) => getFirstStringValue(inc, COL.incident.locationLookup))
    .filter(Boolean) as string[];
  const locationIds = [...new Set([...caseLocationIds, ...incidentLocationIds])];

  const [personsResult, firmsResult, vehiclesResult, officersResult, locationsResult] = await Promise.all([
    retrieveMultipleByIds(
      webAPI,
      TABLE.person,
      COL.person.id,
      [
        ...COL.person.id,
        COL.person.name,
        COL.person.nricFin,
        COL.person.nationality,
        COL.person.alias,
        COL.person.dob,
        COL.person.occupation,
        COL.person.contact,
        COL.person.riskLevel,
      ],
      personIds
    ).catch(() => ({ entity: TABLE.person[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.firm,
      COL.firm.id,
      [...COL.firm.id, COL.firm.name, COL.firm.acraStatus, COL.firm.contact, COL.firm.ssic],
      firmIds
    ).catch(() => ({ entity: TABLE.firm[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.vehicle,
      COL.vehicle.id,
      [
        ...COL.vehicle.id,
        COL.vehicle.name,
        COL.vehicle.plate,
        COL.vehicle.make,
        COL.vehicle.model,
        COL.vehicle.colour,
        COL.vehicle.year,
        COL.vehicle.vin,
        COL.vehicle.status,
      ],
      vehicleIds
    ).catch(() => ({ entity: TABLE.vehicle[0], entities: [] })),
    retrieveMultipleByIds(
      webAPI,
      TABLE.officer,
      COL.officer.id,
      [
        ...COL.officer.id,
        COL.officer.name,
        COL.officer.badge,
        COL.officer.rank,
        COL.officer.department,
        COL.officer.division,
        COL.officer.contact,
        COL.officer.status,
      ],
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
    incidents,
    arrests,
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
  incidents: any[],
  arrests: any[],
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
  const incidentNodeByDvId = new Map<string, string>();
  const arrestNodeByDvId = new Map<string, string>();

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
      closeDate: formatDate(caseRecord[COL.case.closeDate] ?? null),
      priority: getChoiceDisplayValue(caseRecord, COL.case.priority),
      status: getChoiceDisplayValue(caseRecord, COL.case.status),
      summary: String(caseRecord[COL.case.summary] ?? '—'),
      officerId: getFirstStringValue(caseRecord, COL.case.officerLookup),
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
      sublabel: getChoiceDisplayValue(p, COL.person.riskLevel),
      radius: ENTITY_RADII.person,
      details: {
        kind: 'person',
        personId: dvId,
        dvId,
        name: p[COL.person.name] ?? '',
        alias: String(p[COL.person.alias] ?? '—'),
        nricFin: String(p[COL.person.nricFin] ?? '—'),
        nationality: String(p[COL.person.nationality] ?? '—'),
        dateOfBirth: formatDate(p[COL.person.dob]),
        phoneNumber: p[COL.person.contact] ?? '—',
        occupation: String(p[COL.person.occupation] ?? '—'),
        riskLevel: getChoiceDisplayValue(p, COL.person.riskLevel),
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
        kind: 'firm',
        firmId: dvId,
        dvId,
        name: String(f[COL.firm.name] ?? 'Firm'),
        acraStatus: getChoiceDisplayValue(f, COL.firm.acraStatus),
        contact: String(f[COL.firm.contact] ?? '—'),
        ssicCode: String(f[COL.firm.ssic] ?? '—'),
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
        kind: 'vehicle',
        vehicleId: dvId,
        dvId,
        name: String(v[COL.vehicle.name] ?? 'Vehicle'),
        plate: String(v[COL.vehicle.plate] ?? '—'),
        make: String(v[COL.vehicle.make] ?? '—'),
        model: String(v[COL.vehicle.model] ?? '—'),
        colour: String(v[COL.vehicle.colour] ?? '—'),
        year: String(v[COL.vehicle.year] ?? '—'),
        vin: String(v[COL.vehicle.vin] ?? '—'),
        status: getChoiceDisplayValue(v, COL.vehicle.status),
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
      sublabel: getChoiceDisplayValue(o, COL.officer.status),
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'officer',
        officerId: dvId,
        dvId,
        name: String(o[COL.officer.name] ?? 'Officer'),
        badgeNumber: String(o[COL.officer.badge] ?? '—'),
        rank: String(o[COL.officer.rank] ?? '—'),
        department: String(o[COL.officer.department] ?? '—'),
        division: String(o[COL.officer.division] ?? '—'),
        contact: String(o[COL.officer.contact] ?? '—'),
        status: getChoiceDisplayValue(o, COL.officer.status),
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
        kind: 'location',
        locationId: dvId,
        dvId,
        name: String(l[COL.location.name] ?? 'Location'),
        locationType: String(l[COL.location.type] ?? '—'),
        streetAddress: String(l[COL.location.street] ?? '—'),
        postalCode: String(l[COL.location.postal] ?? '—'),
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
        role: getChoiceDisplayValue(ce, COL.caseEntity.role),
        involvementLevel: getChoiceDisplayValue(ce, COL.caseEntity.involvementLevel),
        addedDate: formatDate(ce[COL.caseEntity.addedDate] ?? null),
        notes: String(ce[COL.caseEntity.notes] ?? '—'),
        linkedCaseId: caseId,
        linkedPersonId: personDvId,
      },
    });

    pushLink(caseId, nodeId, 'entity');

    if (personDvId && personNodeByDvId.has(personDvId)) {
      pushLink(nodeId, personNodeByDvId.get(personDvId)!, getChoiceDisplayValue(ce, COL.caseEntity.role));
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

  incidents.forEach((inc, index) => {
    const dvId = getFirstStringValue(inc, COL.incident.id) ?? `incident-${index + 1}`;
    const nodeId = `incident:${dvId}`;
    incidentNodeByDvId.set(dvId, nodeId);
    const incidentLocationId = getFirstStringValue(inc, COL.incident.locationLookup);
    const incidentOfficerId = getFirstStringValue(inc, COL.incident.officerLookup);

    pushNode({
      id: nodeId,
      type: 'incident',
      label: String(inc[COL.incident.name] ?? 'Incident'),
      sublabel: getChoiceDisplayValue(inc, COL.incident.severity),
      radius: ENTITY_RADII.incident,
      details: {
        kind: 'incident',
        incidentId: dvId,
        dvId,
        name: String(inc[COL.incident.name] ?? 'Incident'),
        crimeType: String(inc[COL.incident.crimeType] ?? '—'),
        description: String(inc[COL.incident.description] ?? '—'),
        severity: getChoiceDisplayValue(inc, COL.incident.severity),
        linkedCaseId: caseId,
        locationId: incidentLocationId,
        officerId: incidentOfficerId,
      },
    });

    pushLink(caseId, nodeId, 'incident');
    if (incidentLocationId && locationNodeByDvId.has(incidentLocationId)) {
      pushLink(nodeId, locationNodeByDvId.get(incidentLocationId)!, 'location');
    }
    if (incidentOfficerId && officerNodeByDvId.has(incidentOfficerId)) {
      pushLink(nodeId, officerNodeByDvId.get(incidentOfficerId)!, 'officer');
    }
  });

  arrests.forEach((ar, index) => {
    const dvId = getFirstStringValue(ar, COL.arrest.id) ?? `arrest-${index + 1}`;
    const nodeId = `arrest:${dvId}`;
    arrestNodeByDvId.set(dvId, nodeId);
    const arrestPersonId = getFirstStringValue(ar, COL.arrest.personLookup);
    const arrestOfficerId = getFirstStringValue(ar, COL.arrest.officerLookup);
    const arrestIncidentId = getFirstStringValue(ar, COL.arrest.incidentLookup);

    pushNode({
      id: nodeId,
      type: 'arrest',
      label: String(ar[COL.arrest.name] ?? 'Arrest'),
      sublabel: getChoiceDisplayValue(ar, COL.arrest.bailStatus),
      radius: ENTITY_RADII.arrest,
      details: {
        kind: 'arrest',
        arrestId: dvId,
        dvId,
        name: String(ar[COL.arrest.name] ?? 'Arrest'),
        bailAmount: String(ar[COL.arrest.bailAmount] ?? '—'),
        bailStatus: getChoiceDisplayValue(ar, COL.arrest.bailStatus),
        description: String(ar[COL.arrest.description] ?? '—'),
        linkedCaseId: caseId,
        incidentId: arrestIncidentId,
        officerId: arrestOfficerId,
        personId: arrestPersonId,
      },
    });

    pushLink(caseId, nodeId, 'arrest');
    if (arrestPersonId && personNodeByDvId.has(arrestPersonId)) {
      pushLink(nodeId, personNodeByDvId.get(arrestPersonId)!, 'person');
    }
    if (arrestOfficerId && officerNodeByDvId.has(arrestOfficerId)) {
      pushLink(nodeId, officerNodeByDvId.get(arrestOfficerId)!, 'officer');
    }
    if (arrestIncidentId && incidentNodeByDvId.has(arrestIncidentId)) {
      pushLink(nodeId, incidentNodeByDvId.get(arrestIncidentId)!, 'incident');
    }
  });

  evidenceList.forEach((ev, index) => {
    const dvId = getFirstStringValue(ev, COL.evidence.id) ?? `evidence-${index + 1}`;
    const nodeId = `evidence:${dvId}`;
    pushNode({
      id: nodeId,
      type: 'evidence',
      label: ev[COL.evidence.name] ?? 'Evidence',
      sublabel: getChoiceDisplayValue(ev, COL.evidence.category),
      radius: ENTITY_RADII.evidence,
      details: {
        kind: 'evidence',
        evidenceId: dvId,
        dvId,
        evidenceName: ev[COL.evidence.name] ?? '',
        evidenceType: getChoiceDisplayValue(ev, COL.evidence.category),
        description: String(ev[COL.evidence.description] ?? '—'),
        evidenceFile: '—',
        officerId: getFirstStringValue(ev, COL.evidence.officerLookup),
        incidentId: getFirstStringValue(ev, COL.evidence.incidentLookup),
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

    const incidentDvId = getFirstStringValue(ev, COL.evidence.incidentLookup);
    if (incidentDvId && incidentNodeByDvId.has(incidentDvId)) {
      pushLink(nodeId, incidentNodeByDvId.get(incidentDvId)!, 'incident');
    }
  });

  return { nodes, links };
}
