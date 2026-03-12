import React from 'react';
import type { CaseContext } from '../../types';

interface Props {
  caseContext: CaseContext;
}

const TABS = ['Investigation Board'];
const ACTIVE_TAB = 'Investigation Board';

const TopBar: React.FC<Props> = ({ caseContext }) => {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* D365 Logo area */}
        <div className="topbar-brand">
          <div className="topbar-d365-icon" aria-label="Dynamics 365">⚙</div>
          <span className="topbar-app-name">Nexus</span>
        </div>

        <div className="topbar-divider" />

        {/* Breadcrumb */}
        <nav className="topbar-breadcrumb" aria-label="breadcrumb">
          <span>Cases</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{caseContext.caseId}</span>
        </nav>

        {/* Tab row */}
        <nav className="topbar-tabs" aria-label="Case sections">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`topbar-tab ${tab === ACTIVE_TAB ? 'active' : ''}`}
              aria-current={tab === ACTIVE_TAB ? 'page' : undefined}
            >
              {tab}
              {tab === ACTIVE_TAB && <span className="tab-live-dot" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="topbar-user" aria-label="Logged in user">
          <div className="user-avatar" aria-hidden="true">RK</div>
          <span className="user-name">{caseContext.lead}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
