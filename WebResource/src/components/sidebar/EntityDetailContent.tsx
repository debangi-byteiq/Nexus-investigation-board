import React from 'react';
import type {
  EntityDetails, CaseDetails, PersonDetails,
  CaseEntityDetails, EvidenceDetails, FirmDetails,
  VehicleDetails, OfficerDetails, LocationDetails,
  IncidentDetails, ArrestDetails,
} from '../../types';
import { Field, Section } from './SidebarFields';

interface Props {
  details: EntityDetails;
  accentColor: string;
  onRelatedCaseClick: (id: string) => void;
}

// ── Case ──────────────────────────────────────────────────────────────────────
const CaseContent: React.FC<{ d: CaseDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Case Number" value={d.caseNumber} accent />
        <Field label="Status" value={d.status ?? '—'} warn={!d.isActive} ok={d.isActive} />
        <Field label="Case Name" value={d.name} span />
        <Field label="Open Date" value={d.openDate} />
        <Field label="Close Date" value={d.closeDate ?? '—'} />
        <Field label="Priority" value={d.priority ?? '—'} />
        <Field label="Officer Id" value={d.officerId ?? '—'} />
        <Field label="Summary" value={d.summary ?? '—'} span />
      </div>
    </Section>
  </>
);

// ── Person ─────────────────────────────────────────────────────────────────────
const PersonContent: React.FC<{ d: PersonDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Name" value={d.name} span />
        <Field label="Alias" value={d.alias ?? '—'} />
        <Field label="NRIC/FIN" value={d.nricFin ?? '—'} />
        <Field label="Nationality" value={d.nationality ?? '—'} />
        <Field label="Date of Birth" value={d.dateOfBirth} />
        <Field label="Phone" value={d.phoneNumber} />
        <Field label="Occupation" value={d.occupation ?? '—'} />
        <Field label="Risk Level" value={d.riskLevel ?? '—'} orange={d.isSuspect} />
      </div>
    </Section>
  </>
);

// ── Case Entity ───────────────────────────────────────────────────────────────
const CaseEntityContent: React.FC<{ d: CaseEntityDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Entity Name" value={d.entityName} span accent />
        <Field label="Entity Type" value={d.entityType} />
        <Field label="Role" value={d.role ?? '—'} />
        <Field label="Involvement" value={d.involvementLevel ?? '—'} />
        <Field label="Added Date" value={d.addedDate ?? '—'} />
        <Field label="Linked Person Id" value={d.linkedPersonId ?? '—'} />
        <Field label="Notes" value={d.notes ?? '—'} span />
      </div>
    </Section>
  </>
);

const FirmContent: React.FC<{ d: FirmDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Firm Name" value={d.name} span accent />
        <Field label="ACRA Status" value={d.acraStatus} />
        <Field label="Contact" value={d.contact} />
        <Field label="SSIC Code" value={d.ssicCode} />
      </div>
    </Section>
  </>
);

const VehicleContent: React.FC<{ d: VehicleDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Vehicle Name" value={d.name} span accent />
        <Field label="License Plate" value={d.plate} />
        <Field label="Make" value={d.make} />
        <Field label="Model" value={d.model} />
        <Field label="Colour" value={d.colour} />
        <Field label="Year" value={d.year} />
        <Field label="VIN" value={d.vin} />
        <Field label="Status" value={d.status} />
      </div>
    </Section>
  </>
);

const OfficerContent: React.FC<{ d: OfficerDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Officer Name" value={d.name} span accent />
        <Field label="Badge Number" value={d.badgeNumber} />
        <Field label="Rank" value={d.rank} />
        <Field label="Department" value={d.department} />
        <Field label="Division" value={d.division} />
        <Field label="Contact" value={d.contact} />
        <Field label="Status" value={d.status} />
      </div>
    </Section>
  </>
);

const LocationContent: React.FC<{ d: LocationDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Location Name" value={d.name} span accent />
        <Field label="Location Type" value={d.locationType} />
        <Field label="Street Address" value={d.streetAddress} span />
        <Field label="Postal Code" value={d.postalCode} />
      </div>
    </Section>
  </>
);

// ── Evidence ──────────────────────────────────────────────────────────────────
const EvidenceContent: React.FC<{ d: EvidenceDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Evidence Name" value={d.evidenceName} span accent />
        <Field label="Evidence Type" value={d.evidenceType} />
        <Field label="Officer Id" value={d.officerId ?? '—'} />
        <Field label="Incident Id" value={d.incidentId ?? '—'} />
        <Field label="Collected Date" value={d.collectedDate} />
        <Field label="Description" value={d.description ?? '—'} span />
        <Field label="Evidence File" value={d.evidenceFile ?? '—'} span />
      </div>
    </Section>
  </>
);

const IncidentContent: React.FC<{ d: IncidentDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Incident Name" value={d.name} span accent />
        <Field label="Crime Type" value={d.crimeType} />
        <Field label="Severity" value={d.severity} />
        <Field label="Location Id" value={d.locationId ?? '—'} />
        <Field label="Officer Id" value={d.officerId ?? '—'} />
        <Field label="Description" value={d.description} span />
      </div>
    </Section>
  </>
);

const ArrestContent: React.FC<{ d: ArrestDetails }> = ({ d }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Arrest Name" value={d.name} span accent />
        <Field label="Bail Amount" value={d.bailAmount} />
        <Field label="Bail Status" value={d.bailStatus} />
        <Field label="Person Id" value={d.personId ?? '—'} />
        <Field label="Officer Id" value={d.officerId ?? '—'} />
        <Field label="Incident Id" value={d.incidentId ?? '—'} />
        <Field label="Description" value={d.description} span />
      </div>
    </Section>
  </>
);

// ── Router ────────────────────────────────────────────────────────────────────
const EntityDetailContent: React.FC<Props> = ({ details }) => {
  switch (details.kind) {
    case 'case':
      return <CaseContent d={details} />;
    case 'person':
      return <PersonContent d={details} />;
    case 'caseEntity':
      return <CaseEntityContent d={details} />;
    case 'firm':
      return <FirmContent d={details} />;
    case 'vehicle':
      return <VehicleContent d={details} />;
    case 'officer':
      return <OfficerContent d={details} />;
    case 'location':
      return <LocationContent d={details} />;
    case 'evidence':
      return <EvidenceContent d={details} />;
    case 'incident':
      return <IncidentContent d={details} />;
    case 'arrest':
      return <ArrestContent d={details} />;
  }
};

export default EntityDetailContent;
