import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { fetchGraphData } from './data/dataverse';
import type { DataverseWebAPI } from './data/dataverse';
import './css/NexusBoard.css';

// The Dataverse Xrm context is available on the parent window for Web Resources
declare const window: any;

// Create a bridge that implements our PCF DataverseWebAPI interface
// using the global parent.Xrm.WebApi object
const webApiBridge: DataverseWebAPI = {
  retrieveRecord: async (entityType: string, id: string, options?: string) => {
    return window.parent.Xrm.WebApi.retrieveRecord(entityType, id, options);
  },
  retrieveMultipleRecords: async (entityType: string, options?: string) => {
    return window.parent.Xrm.WebApi.retrieveMultipleRecords(entityType, options);
  }
};

function sanitizeGuid(value: string): string {
  return value.replace(/[{}]/g, '').trim();
}

function getCaseIdFromDataParam(rawData: string): string {
  const decoded = decodeURIComponent(rawData);

  // Supports both plain GUID ("<guid>") and key/value payloads ("id=<guid>").
  if (decoded.includes('=')) {
    const nested = new URLSearchParams(decoded);
    const candidate = nested.get('id') ?? nested.get('caseId') ?? nested.get('caseid');
    if (candidate) {
      return sanitizeGuid(candidate);
    }
  }

  return sanitizeGuid(decoded);
}

async function initWebResource() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  const hasXrmWebApi = Boolean(window.parent?.Xrm?.WebApi);

  // 1. Determine the Case ID
  let caseId = '';

  // Method A: Check if passed via URL parameters (standard for Web Resources)
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  if (dataParam) {
    caseId = getCaseIdFromDataParam(dataParam);
  }
  // Method B: Try to read directly from the parent form context
  else if (window.parent?.Xrm?.Page?.data?.entity) {
    caseId = sanitizeGuid(window.parent.Xrm.Page.data.entity.getId() ?? '');
  }

  // 2. Render Loading State (or mock state if no caseId)
  if (!caseId) {
    console.warn("No Case ID found in context. Rendering App without data.");
    root.render(<React.StrictMode><App /></React.StrictMode>);
    return;
  }

  if (!hasXrmWebApi) {
    root.render(
      <React.StrictMode>
        <App error="Xrm.WebApi was not found in the host page. Open this web resource from a model-driven app form." />
      </React.StrictMode>
    );
    return;
  }

  // Render initial loading state while fetching
  root.render(<React.StrictMode><App loading={true} /></React.StrictMode>);

  try {
    // 3. Fetch data via Xrm.WebApi bridge
    const graphData = await fetchGraphData(webApiBridge, caseId);
    
    // 4. Render Graph
    root.render(
      <React.StrictMode>
        <App graphData={graphData} />
      </React.StrictMode>
    );

  } catch (err: any) {
    console.error("Dataverse Fetch Error:", err);
    root.render(
      <React.StrictMode>
        <App error={err.message || "Failed to load data from Dynamics 365"} />
      </React.StrictMode>
    );
  }
}

// Kick off
initWebResource();
