import React from 'react';

interface FieldProps {
  label: string;
  value: React.ReactNode;
  span?: boolean;
  accent?: boolean;
  warn?: boolean;
  ok?: boolean;
  orange?: boolean;
}

export const Field: React.FC<FieldProps> = ({ label, value, span, accent, warn, ok, orange }) => {
  const cls = ['fv', accent ? 'fv-accent' : '', warn ? 'fv-warn' : '', ok ? 'fv-ok' : '', orange ? 'fv-orange' : ''].filter(Boolean).join(' ');
  return (
    <div className={`fitem ${span ? 'span2' : ''}`}>
      <div className="fk">{label}</div>
      <div className={cls}>{value}</div>
    </div>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="sb-section">
    <div className="sb-sec-hdr"><span>{title}</span></div>
    {children}
  </div>
);

interface TagRowProps { tags: string[]; }

export const TagRow: React.FC<TagRowProps> = ({ tags }) => (
  <div className="tag-row" role="list" aria-label="Tags">
    {tags.map(t => (
      <span key={t} className="entity-tag" role="listitem">{t}</span>
    ))}
  </div>
);

interface TimelineProps {
  entries: { event: string; timestamp: string }[];
  accentColor: string;
}

export const Timeline: React.FC<TimelineProps> = ({ entries, accentColor }) => (
  <ol className="timeline-list" aria-label="Activity timeline">
    {entries.map((entry, i) => (
      <li key={i} className="timeline-item">
        <div className="tl-dot" style={{ borderColor: accentColor + '55' }} aria-hidden="true" />
        <div className="tl-right">
          <div className="tl-event">{entry.event}</div>
          <time className="tl-time">{entry.timestamp}</time>
        </div>
      </li>
    ))}
  </ol>
);

interface NoteBlockProps { text: string; }
export const NoteBlock: React.FC<NoteBlockProps> = ({ text }) => (
  <blockquote className="note-block">{text}</blockquote>
);
