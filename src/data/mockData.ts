import type { GraphData, CaseContext } from '../types';
import { ENTITY_RADII } from '../utils/constants';

export const CASE_CONTEXT: CaseContext = {
  caseId:   'CR-2024-0091',
  caseName: 'Riverside Homicide',
  caseType: 'Murder',
  status:   'Open',
  priority: 'High',
  lead:     'Det. R. Kumar',
};

export const GRAPH_DATA: GraphData = {
  nodes: [
    // ── CASE (root node)
    {
      id: 'case-001', type: 'case',
      label: 'CR-2024-0091', sublabel: 'Riverside Homicide',
      radius: ENTITY_RADII.case,
      details: {
        kind: 'case',
        caseId: 'CR-2024-0091', dvId: 'incident_4a9f…c231',
        name: 'Riverside Homicide', status: 'Open', priority: 'High',
        type: 'Murder', opened: 'Nov 12, 2024', lead: 'Det. R. Kumar',
        description: 'Unidentified victim found behind Riverside Industrial Area. Forensics team deployed. Primary suspect identified via CCTV. Investigation ongoing.',
        tags: ['Forensics Pending', 'Suspect Known', 'High Priority'],
        timeline: [
          { event: 'Case opened in Dataverse', timestamp: 'Nov 12, 2024 · 02:14' },
          { event: 'Forensics team dispatched to scene', timestamp: 'Nov 12, 2024 · 04:10' },
          { event: 'First contact record linked', timestamp: 'Nov 14, 2024 · 09:00' },
          { event: 'Suspect identified via CCTV analysis', timestamp: 'Nov 14, 2024 · 11:45' },
          { event: 'Surveillance approved by supervisor', timestamp: 'Nov 15, 2024' },
        ],
      },
    },

    // ── CONTACTS
    {
      id: 'con-001', type: 'contact',
      label: 'Marcus Henley', sublabel: 'Suspect',
      radius: ENTITY_RADII.contact,
      details: {
        kind: 'contact',
        contactId: 'CON-003', dvId: 'contact_8b2e…a104',
        name: 'Marcus Henley', role: 'Suspect',
        status: 'Under Surveillance',
        dob: '14 Jun 1988', phone: '+1 (555) 0183',
        address: '22B Canal Street, Eastside',
        occupation: 'Freelance Mechanic',
        priors: 'Assault (2019), Possession (2021)',
        note: 'CCTV footage places suspect at Riverside Rd at 01:58 on the night of the incident. Grey sedan matching his registered vehicle spotted nearby.',
        tags: ['Armed Caution', 'Do Not Approach Alone', 'CCTV Identified'],
        timeline: [
          { event: 'Contact record created in Dataverse', timestamp: 'Nov 14, 2024' },
          { event: 'Surveillance operation initiated', timestamp: 'Nov 15, 2024' },
          { event: 'Phone records subpoenaed', timestamp: 'Nov 18, 2024' },
          { event: 'Vehicle APB issued', timestamp: 'Nov 18, 2024' },
        ],
        relatedCases: [
          { id: 'CR-2024-0033', name: 'Warehouse Break-in', matchReason: 'Marcus Henley flagged as PoI in this case too', status: 'Active' },
          { id: 'CR-2022-0078', name: 'Canal Street Assault', matchReason: 'Shared contact record from prior incident', status: 'Closed' },
        ],
      },
    },
    {
      id: 'con-002', type: 'contact',
      label: 'John Doe', sublabel: 'Victim',
      radius: ENTITY_RADII.contact,
      details: {
        kind: 'contact',
        contactId: 'CON-001', dvId: 'contact_2c7f…b009',
        name: 'Unnamed Victim (John Doe)', role: 'Victim',
        status: 'Deceased',
        dob: 'Unknown', phone: 'N/A',
        address: 'Unknown', occupation: 'Unknown',
        note: 'Body discovered Nov 12 at 02:14 by security guard. Blunt force trauma to posterior skull. DNA sample submitted to forensics lab. Identification pending.',
        tags: ['ID Pending', 'DNA Submitted', 'Post-Mortem Completed'],
        timeline: [
          { event: 'Body discovered, record created', timestamp: 'Nov 12, 2024 · 02:14' },
          { event: 'Post-mortem examination conducted', timestamp: 'Nov 12, 2024 · 14:00' },
          { event: 'DNA sample sent to forensics lab', timestamp: 'Nov 13, 2024' },
          { event: 'Lab result pending — awaiting ID', timestamp: 'Nov 20, 2024' },
        ],
        relatedCases: [],
      },
    },
    {
      id: 'con-003', type: 'contact',
      label: 'Dev Ramirez', sublabel: 'Witness',
      radius: ENTITY_RADII.contact,
      details: {
        kind: 'contact',
        contactId: 'CON-004', dvId: 'contact_9d1a…e441',
        name: 'Dev Ramirez', role: 'Witness',
        status: 'Statement Taken',
        dob: '03 Feb 1979', phone: '+1 (555) 0247',
        address: 'Riverside Industrial, Staff Housing',
        occupation: 'Security Guard — RIL',
        note: 'First to discover body while on patrol. Provided initial statement and granted CCTV footage access. Cooperating fully with investigation.',
        tags: ['Cooperating', 'Statement Taken', 'CCTV Access Granted'],
        timeline: [
          { event: 'Discovered body, called emergency services', timestamp: 'Nov 12, 2024 · 02:14' },
          { event: 'Witness statement formally recorded', timestamp: 'Nov 12, 2024 · 04:30' },
          { event: 'CCTV footage access provided', timestamp: 'Nov 12, 2024 · 08:00' },
        ],
        relatedCases: [],
      },
    },

    // ── CONNECTIONS
    {
      id: 'conn-001', type: 'connection',
      label: 'Vehicle Ownership', sublabel: 'Henley → Sedan',
      radius: ENTITY_RADII.connection,
      details: {
        kind: 'connection',
        connectionId: 'CONN-007', dvId: 'connection_1f3b…d882',
        name: 'Owns — Marcus Henley → Grey Sedan GJ-5T',
        from: 'Marcus Henley (CON-003)',
        to: 'Vehicle GJ-5T 2291',
        relType: 'Vehicle Ownership',
        confirmedBy: 'DMV Records', since: '2022', status: 'Verified',
        note: 'Ownership confirmed via DMV records. Grey Toyota Corolla 2019 registered to Henley. Vehicle spotted on CCTV Cam 1 at 01:52 near the scene. APB issued Nov 15.',
        tags: ['Verified', 'DMV Confirmed', 'APB Issued'],
        timeline: [
          { event: 'Connection record created in Dataverse', timestamp: 'Nov 15, 2024' },
          { event: 'DMV verification completed', timestamp: 'Nov 16, 2024' },
          { event: 'APB issued for vehicle GJ-5T 2291', timestamp: 'Nov 15, 2024' },
        ],
        relatedCases: [],
      },
    },
    {
      id: 'conn-002', type: 'connection',
      label: 'Suspect of Case', sublabel: 'Case link',
      radius: ENTITY_RADII.connection,
      details: {
        kind: 'connection',
        connectionId: 'CONN-008', dvId: 'connection_3c8d…f114',
        name: 'Suspect — Marcus Henley ↔ CR-2024-0091',
        from: 'Marcus Henley (CON-003)',
        to: 'CR-2024-0091',
        relType: 'Suspect of Incident',
        confirmedBy: 'CCTV Frame Analysis', since: 'Nov 14, 2024', status: 'Active Investigation',
        note: 'CCTV footage frame extraction places suspect silhouette consistent with Henley at the scene at 01:58, approximately 16 minutes before estimated time of death.',
        tags: ['Active', 'CCTV Basis', 'Supervisor Approved'],
        timeline: [
          { event: 'Connection record created in Dataverse', timestamp: 'Nov 14, 2024 · 11:45' },
          { event: 'Approved by supervisor — Det. Singh', timestamp: 'Nov 15, 2024' },
        ],
        relatedCases: [],
      },
    },

    // ── ANNOTATIONS
    {
      id: 'annot-001', type: 'annotation',
      label: 'Post-Mortem Report', sublabel: 'PDF · Forensics',
      radius: ENTITY_RADII.annotation,
      details: {
        kind: 'annotation',
        annotationId: 'NOTE-011', dvId: 'annotation_7a2c…e993',
        name: 'Post-Mortem Report — CR-2024-0091',
        docType: 'PDF · 3.2 MB', createdBy: 'Dr. Priya Lal (Forensics)',
        created: 'Nov 12, 2024 · 18:00', status: 'Final',
        subject: 'Blunt force trauma confirmed as Cause of Death',
        note: 'Victim suffered 3 blows to the posterior skull consistent with iron rod. No defensive wounds found. Time of death estimated 00:30–01:30. Full toxicology pending.',
        tags: ['Forensics', 'Final Report', 'CoD Confirmed'],
        timeline: [
          { event: 'Draft report uploaded to Dataverse', timestamp: 'Nov 12, 2024 · 18:00' },
          { event: 'Report finalised by Dr. Priya Lal', timestamp: 'Nov 13, 2024 · 09:30' },
          { event: 'Toxicology results pending attachment', timestamp: 'Awaiting' },
        ],
        relatedCases: [
          { id: 'CR-2023-0055', name: 'Riverside Arson', matchReason: 'Same forensics team · shared evidence log entries', status: 'Closed' },
        ],
      },
    },
    {
      id: 'annot-002', type: 'annotation',
      label: 'CCTV Frame Extract', sublabel: 'Image · Key Evidence',
      radius: ENTITY_RADII.annotation,
      details: {
        kind: 'annotation',
        annotationId: 'NOTE-012', dvId: 'annotation_5e4a…b771',
        name: 'CCTV Frame Extract — North Gate Cam 3',
        docType: 'JPG Image · 1.8 MB', createdBy: 'Forensic Tech T. Singh',
        created: 'Nov 14, 2024 · 10:30', status: 'Evidence Linked',
        subject: 'Suspect silhouette captured at 01:58',
        note: 'Frame extracted from North Gate Camera 3. Silhouette height and build consistent with Marcus Henley (CON-003). Image submitted for biometric comparison.',
        tags: ['Key Evidence', 'Suspect Frame', 'CCTV', 'Biometric Pending'],
        timeline: [
          { event: 'Frame extracted from raw CCTV footage', timestamp: 'Nov 14, 2024 · 10:30' },
          { event: 'Linked to contact record CON-003', timestamp: 'Nov 14, 2024 · 11:45' },
          { event: 'Submitted for biometric analysis', timestamp: 'Nov 15, 2024' },
        ],
        relatedCases: [
          { id: 'CR-2024-0033', name: 'Warehouse Break-in', matchReason: 'Same suspect identified from CCTV in that case', status: 'Active' },
        ],
      },
    },
    {
      id: 'annot-003', type: 'annotation',
      label: 'Scene Survey Note', sublabel: 'Field Note',
      radius: ENTITY_RADII.annotation,
      details: {
        kind: 'annotation',
        annotationId: 'NOTE-013', dvId: 'annotation_2b9f…c220',
        name: 'Field Note — Initial Scene Survey',
        docType: 'Text Note', createdBy: 'Det. R. Kumar',
        created: 'Nov 12, 2024 · 06:00', status: 'Internal',
        subject: 'Scene assessment — entry points, blood trail, no inside struggle',
        note: 'Two broken fence rails at south access point. Evidence of forced entry. Blood trail runs north–south approximately 18m. No signs of struggle inside adjacent warehouse. Iron rod fragment found 8m north of body.',
        tags: ['Field Note', 'Scene Survey', 'Internal', 'Entry Point ID'],
        timeline: [
          { event: 'Note dictated and created on scene', timestamp: 'Nov 12, 2024 · 06:00' },
          { event: 'Reviewed and approved by senior officer', timestamp: 'Nov 12, 2024 · 09:00' },
        ],
        relatedCases: [],
      },
    },

    // ── RELATED CASES
    {
      id: 'rel-001', type: 'related',
      label: 'CR-2023-0055', sublabel: 'Riverside Arson',
      radius: ENTITY_RADII.related,
      details: {
        kind: 'related',
        caseId: 'CR-2023-0055', dvId: 'incident_1c8b…f340',
        name: 'Riverside Arson',
        linkType: 'Location Match', confidence: 'High',
        status: 'Closed', closedDate: 'Feb 2024',
        linkReason: 'Same compound — Riverside Industrial Area. Evidence recovered from same site. Identical south fence entry point used in both cases.',
        overlap: 'Physical Location · Entry Point · Compound',
        tags: ['Closed', 'Location Match', 'Same Compound', 'Shared Entry Point'],
        timeline: [
          { event: 'Cross-case link identified by analyst', timestamp: 'Nov 16, 2024' },
          { event: 'Historical case file reviewed', timestamp: 'Nov 17, 2024' },
          { event: 'Location overlap confirmed', timestamp: 'Nov 17, 2024' },
        ],
        relatedCases: [
          { id: 'CR-2023-0012', name: 'Industrial Zone Theft', matchReason: 'Same zone, prior activity in 2023', status: 'Closed' },
        ],
      },
    },
    {
      id: 'rel-002', type: 'related',
      label: 'CR-2024-0033', sublabel: 'Warehouse Break-in',
      radius: ENTITY_RADII.related,
      details: {
        kind: 'related',
        caseId: 'CR-2024-0033', dvId: 'incident_9d3e…a122',
        name: 'Warehouse Break-in',
        linkType: 'Location + Suspect Match', confidence: 'Very High',
        status: 'Active', closedDate: null,
        linkReason: 'Same south fence breach entry point. Marcus Henley also flagged as person of interest in this case. Investigating officer believes cases are connected.',
        overlap: 'Physical Location · Suspect · Entry Point · Method',
        tags: ['Active', 'Location + Suspect Match', 'Very High Confidence', 'Cross-Case Review'],
        timeline: [
          { event: 'Link identified via suspect record match', timestamp: 'Nov 18, 2024' },
          { event: 'Cross-case review formally initiated', timestamp: 'Nov 19, 2024' },
          { event: 'Assigned to Det. R. Kumar for joint review', timestamp: 'Nov 20, 2024' },
        ],
        relatedCases: [
          { id: 'CR-2023-0055', name: 'Riverside Arson', matchReason: 'All three cases share the same location', status: 'Closed' },
        ],
      },
    },
  ],

  links: [
    { source: 'case-001',  target: 'con-001',   label: 'suspect' },
    { source: 'case-001',  target: 'con-002',   label: 'victim' },
    { source: 'case-001',  target: 'con-003',   label: 'witness' },
    { source: 'case-001',  target: 'annot-001', label: 'document' },
    { source: 'case-001',  target: 'annot-002', label: 'evidence' },
    { source: 'case-001',  target: 'annot-003', label: 'note' },
    { source: 'case-001',  target: 'rel-001',   label: 'related case' },
    { source: 'case-001',  target: 'rel-002',   label: 'related case' },
    { source: 'con-001',   target: 'conn-001',  label: 'owns vehicle' },
    { source: 'con-001',   target: 'conn-002',  label: 'linked as' },
    { source: 'conn-002',  target: 'case-001',  label: '' },
    { source: 'annot-002', target: 'con-001',   label: 'identifies' },
    { source: 'annot-001', target: 'con-002',   label: 'confirms CoD' },
  ],
};
