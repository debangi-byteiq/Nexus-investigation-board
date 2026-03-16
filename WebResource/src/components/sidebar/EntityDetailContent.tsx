import React from 'react';
import type {
  EntityDetails, CaseDetails, PersonDetails,
  CaseEntityDetails, EvidenceDetails,
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
        <Field label="Status" value={d.isActive ? 'Active' : 'Inactive'} warn={!d.isActive} ok={d.isActive} />
        <Field label="Case Name" value={d.name} span />
        <Field label="Open Date" value={d.openDate} />
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
        <Field label="Role" value={d.isSuspect ? 'Suspect' : 'Person'} orange={d.isSuspect} />
        <Field label="Date of Birth" value={d.dateOfBirth} />
        <Field label="Phone" value={d.phoneNumber} />
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
        <Field label="Collected Date" value={d.collectedDate} />
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
    case 'evidence':
      return <EvidenceContent d={details} />;
  }
};

export default EntityDetailContent;
