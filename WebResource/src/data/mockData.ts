import type { GraphData } from '../types';
import { ENTITY_RADII } from '../utils/constants';

/**
 * Mock data matching the Dataverse schema:
 *   Case → Person (via CaseEntity) → Evidence
 *
 * This is used for local development only.
 * In D365, real data comes from dataverse.ts → fetchGraphData()
 */

export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [
    // ── CASE (root node)
    {
      id: 'case-001', type: 'case',
      label: 'CR-2024-0091', sublabel: 'Riverside Homicide',
      radius: ENTITY_RADII.case,
      details: {
        kind: 'case',
        caseId: 'case-001', dvId: 'incident_4a9f…c231',
        name: 'Riverside Homicide',
        caseNumber: 'CR-2024-0091',
        openDate: 'Nov 12, 2024',
        isActive: true,
      },
    },

    // ── PERSONS
    {
      id: 'person-001', type: 'person',
      label: 'Marcus Henley', sublabel: 'Suspect',
      radius: ENTITY_RADII.person,
      details: {
        kind: 'person',
        personId: 'person-001', dvId: 'person_8b2e…a104',
        name: 'Marcus Henley',
        dateOfBirth: 'Jun 14, 1988',
        phoneNumber: '+1 (555) 0183',
        isSuspect: true,
      },
    },
    {
      id: 'person-002', type: 'person',
      label: 'John Doe', sublabel: 'Person',
      radius: ENTITY_RADII.person,
      details: {
        kind: 'person',
        personId: 'person-002', dvId: 'person_2c7f…b009',
        name: 'Unnamed Victim (John Doe)',
        dateOfBirth: 'Unknown',
        phoneNumber: 'N/A',
        isSuspect: false,
      },
    },
    {
      id: 'person-003', type: 'person',
      label: 'Dev Ramirez', sublabel: 'Person',
      radius: ENTITY_RADII.person,
      details: {
        kind: 'person',
        personId: 'person-003', dvId: 'person_9d1a…e441',
        name: 'Dev Ramirez',
        dateOfBirth: 'Feb 03, 1979',
        phoneNumber: '+1 (555) 0247',
        isSuspect: false,
      },
    },

    // ── CASE ENTITIES (junction table)
    {
      id: 'ce-001', type: 'caseEntity',
      label: 'Suspect Link', sublabel: 'Suspect',
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'caseEntity',
        caseEntityId: 'ce-001', dvId: 'caseentity_1f3b…d882',
        entityName: 'Marcus Henley → Case',
        entityType: 'Suspect',
        linkedCaseId: 'case-001',
        linkedPersonId: 'person-001',
      },
    },
    {
      id: 'ce-002', type: 'caseEntity',
      label: 'Victim Link', sublabel: 'Victim',
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'caseEntity',
        caseEntityId: 'ce-002', dvId: 'caseentity_3c8d…f114',
        entityName: 'John Doe → Case',
        entityType: 'Victim',
        linkedCaseId: 'case-001',
        linkedPersonId: 'person-002',
      },
    },
    {
      id: 'ce-003', type: 'caseEntity',
      label: 'Witness Link', sublabel: 'Witness',
      radius: ENTITY_RADII.caseEntity,
      details: {
        kind: 'caseEntity',
        caseEntityId: 'ce-003', dvId: 'caseentity_5a7e…b033',
        entityName: 'Dev Ramirez → Case',
        entityType: 'Witness',
        linkedCaseId: 'case-001',
        linkedPersonId: 'person-003',
      },
    },

    // ── EVIDENCE
    {
      id: 'ev-001', type: 'evidence',
      label: 'Post-Mortem Report', sublabel: 'PDF',
      radius: ENTITY_RADII.evidence,
      details: {
        kind: 'evidence',
        evidenceId: 'ev-001', dvId: 'evidence_7a2c…e993',
        evidenceName: 'Post-Mortem Report',
        evidenceType: 'PDF Document',
        collectedDate: 'Nov 12, 2024',
        linkedCaseId: 'case-001',
        linkedCaseEntityId: 'ce-002',
      },
    },
    {
      id: 'ev-002', type: 'evidence',
      label: 'CCTV Frame Extract', sublabel: 'Image',
      radius: ENTITY_RADII.evidence,
      details: {
        kind: 'evidence',
        evidenceId: 'ev-002', dvId: 'evidence_5e4a…b771',
        evidenceName: 'CCTV Frame Extract — Cam 3',
        evidenceType: 'JPG Image',
        collectedDate: 'Nov 14, 2024',
        linkedCaseId: 'case-001',
        linkedCaseEntityId: 'ce-001',
      },
    },
    {
      id: 'ev-003', type: 'evidence',
      label: 'Scene Survey Note', sublabel: 'Field Note',
      radius: ENTITY_RADII.evidence,
      details: {
        kind: 'evidence',
        evidenceId: 'ev-003', dvId: 'evidence_2b9f…c220',
        evidenceName: 'Field Note — Initial Scene Survey',
        evidenceType: 'Text Note',
        collectedDate: 'Nov 12, 2024',
        linkedCaseId: 'case-001',
        linkedCaseEntityId: null,
      },
    },
  ],

  links: [
    // Case → CaseEntities
    { source: 'case-001', target: 'ce-001', label: 'entity' },
    { source: 'case-001', target: 'ce-002', label: 'entity' },
    { source: 'case-001', target: 'ce-003', label: 'entity' },
    // CaseEntities → Persons
    { source: 'ce-001',   target: 'person-001', label: 'suspect' },
    { source: 'ce-002',   target: 'person-002', label: 'victim' },
    { source: 'ce-003',   target: 'person-003', label: 'witness' },
    // Case → Evidence
    { source: 'case-001', target: 'ev-001', label: 'evidence' },
    { source: 'case-001', target: 'ev-002', label: 'evidence' },
    { source: 'case-001', target: 'ev-003', label: 'evidence' },
    // Evidence → CaseEntity (where linked)
    { source: 'ev-001',   target: 'ce-002', label: 'linked to' },
    { source: 'ev-002',   target: 'ce-001', label: 'identifies' },
  ],
};
