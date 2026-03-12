import React from 'react';
import type {
  EntityDetails, CaseDetails, ContactDetails,
  ConnectionDetails, AnnotationDetails, RelatedCaseDetails,
} from '../../types';
import { Field, Section, TagRow, Timeline, NoteBlock } from './SidebarFields';
import RelatedCasesAccordion from './RelatedCasesAccordion';

interface Props {
  details: EntityDetails;
  accentColor: string;
  onRelatedCaseClick: (id: string) => void;
}

// ── Case ──────────────────────────────────────────────────────────────────────
const CaseContent: React.FC<{ d: CaseDetails; color: string; onRelated: (id: string) => void }> = ({ d, color, onRelated }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Case ID"  value={d.caseId} accent />
        <Field label="Status"   value={d.status} warn />
        <Field label="Priority" value={d.priority} warn />
        <Field label="Type"     value={d.type} accent />
        <Field label="Opened"   value={d.opened} />
        <Field label="Lead Detective" value={d.lead} />
      </div>
    </Section>
    <Section title="Description">
      <NoteBlock text={d.description} />
    </Section>
    <Section title="Tags">
      <TagRow tags={d.tags} />
    </Section>
    <Section title="Activity Log">
      <Timeline entries={d.timeline} accentColor={color} />
    </Section>
  </>
);

// ── Contact ───────────────────────────────────────────────────────────────────
const ContactContent: React.FC<{ d: ContactDetails; color: string; onRelated: (id: string) => void }> = ({ d, color, onRelated }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Role"       value={d.role} orange />
        <Field label="Status"     value={d.status} />
        <Field label="DOB"        value={d.dob} />
        <Field label="Phone"      value={d.phone} />
        <Field label="Address"    value={d.address} span />
        <Field label="Occupation" value={d.occupation} span />
        {d.priors && <Field label="Prior Record" value={d.priors} span warn />}
      </div>
    </Section>
    <Section title="Investigative Note">
      <NoteBlock text={d.note} />
    </Section>
    <Section title="Tags">
      <TagRow tags={d.tags} />
    </Section>
    <Section title="Activity Log">
      <Timeline entries={d.timeline} accentColor={color} />
    </Section>
    {d.relatedCases.length > 0 && (
      <Section title="Cross-Case References">
        <RelatedCasesAccordion cases={d.relatedCases} onCaseClick={onRelated} />
      </Section>
    )}
  </>
);

// ── Connection ────────────────────────────────────────────────────────────────
const ConnectionContent: React.FC<{ d: ConnectionDetails; color: string; onRelated: (id: string) => void }> = ({ d, color, onRelated }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="From"         value={d.from} span accent />
        <Field label="To"           value={d.to} span accent />
        <Field label="Type"         value={d.relType} />
        <Field label="Status"       value={d.status} ok />
        <Field label="Confirmed By" value={d.confirmedBy} />
        <Field label="Since"        value={d.since} />
      </div>
    </Section>
    <Section title="Notes">
      <NoteBlock text={d.note} />
    </Section>
    <Section title="Tags">
      <TagRow tags={d.tags} />
    </Section>
    <Section title="Activity Log">
      <Timeline entries={d.timeline} accentColor={color} />
    </Section>
  </>
);

// ── Annotation ────────────────────────────────────────────────────────────────
const AnnotationContent: React.FC<{ d: AnnotationDetails; color: string; onRelated: (id: string) => void }> = ({ d, color, onRelated }) => (
  <>
    <Section title="Record Details">
      <div className="fgrid">
        <Field label="Document Type" value={d.docType} span accent />
        <Field label="Created By"    value={d.createdBy} span />
        <Field label="Date"          value={d.created} />
        <Field label="Status"        value={d.status} ok />
        <Field label="Subject"       value={d.subject} span />
      </div>
    </Section>
    <Section title="Content">
      <NoteBlock text={d.note} />
    </Section>
    <Section title="Tags">
      <TagRow tags={d.tags} />
    </Section>
    <Section title="Activity Log">
      <Timeline entries={d.timeline} accentColor={color} />
    </Section>
    {d.relatedCases.length > 0 && (
      <Section title="Cross-Case References">
        <RelatedCasesAccordion cases={d.relatedCases} onCaseClick={onRelated} />
      </Section>
    )}
  </>
);

// ── Related Case ──────────────────────────────────────────────────────────────
const RelatedCaseContent: React.FC<{ d: RelatedCaseDetails; color: string; onRelated: (id: string) => void }> = ({ d, color, onRelated }) => (
  <>
    <Section title="Link Details">
      <div className="fgrid">
        <Field label="Link Type"   value={d.linkType} accent />
        <Field label="Confidence"  value={d.confidence} ok />
        <Field label="Status"      value={d.status} />
        <Field label="Closed"      value={d.closedDate ?? 'Active'} />
        <Field label="Overlap"     value={d.overlap} span />
        <Field label="Link Reason" value={d.linkReason} span />
      </div>
    </Section>
    <Section title="Tags">
      <TagRow tags={d.tags} />
    </Section>
    <Section title="Activity Log">
      <Timeline entries={d.timeline} accentColor={color} />
    </Section>
    {d.relatedCases.length > 0 && (
      <Section title="Further References">
        <RelatedCasesAccordion cases={d.relatedCases} onCaseClick={onRelated} />
      </Section>
    )}
  </>
);

// ── Router ────────────────────────────────────────────────────────────────────
const EntityDetailContent: React.FC<Props> = ({ details, accentColor, onRelatedCaseClick }) => {
  switch (details.kind) {
    case 'case':
      return <CaseContent d={details} color={accentColor} onRelated={onRelatedCaseClick} />;
    case 'contact':
      return <ContactContent d={details} color={accentColor} onRelated={onRelatedCaseClick} />;
    case 'connection':
      return <ConnectionContent d={details} color={accentColor} onRelated={onRelatedCaseClick} />;
    case 'annotation':
      return <AnnotationContent d={details} color={accentColor} onRelated={onRelatedCaseClick} />;
    case 'related':
      return <RelatedCaseContent d={details} color={accentColor} onRelated={onRelatedCaseClick} />;
  }
};

export default EntityDetailContent;
