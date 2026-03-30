import React from 'react';
import type { LoadingStep } from '../../types';

const LOADING_STEPS = [
  { key: 'fetch-case', label: 'Fetching case details' },
  { key: 'fetch-contacts', label: 'Fetching contacts' },
  { key: 'fetch-connections', label: 'Fetching connections' },
  { key: 'fetch-annotations', label: 'Fetching annotations' },
  { key: 'fetch-related', label: 'Fetching related cases' },
  { key: 'build-graph', label: 'Building graph' },
] as const;

interface Props {
  currentStep: LoadingStep;
  completedSteps: Set<LoadingStep>;
  progress: number;
  visible: boolean;
}

const LoadingScreen: React.FC<Props> = ({ currentStep, completedSteps, progress, visible }) => {
  return (
    <div
      className={`loader-overlay ${!visible ? 'loader-out' : ''}`}
      aria-hidden={!visible}
    >
      <div className="loader-content">
        <div className="loader-eyebrow">↯ NEXUS Board · Dataverse PCF</div>
        <div className="loader-title">
          Building<br />
          <span className="loader-title-accent">Investigation Graph</span>
        </div>

        <div className="loader-progress-wrap">
          <div className="loader-steps">
            {LOADING_STEPS.map(({ key, label }) => {
              const isDone = completedSteps.has(key as LoadingStep);
              const isActive = currentStep === key && !isDone;
              return (
                <div
                  key={key}
                  className={`loader-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="loader-step-dot">
                    {isDone ? '✓' : isActive ? '◉' : '◌'}
                  </div>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          <div className="loader-bar-track">
            <div
              className="loader-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="loader-progress-label">
            {progress}% — Parallel Dataverse queries
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
