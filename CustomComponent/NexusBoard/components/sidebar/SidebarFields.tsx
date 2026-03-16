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
