# NEXUS Investigation Board — Technical Documentation

## Overview
The **NEXUS Investigation Board** is a React-based interactive graph visualization tool embedded directly into Microsoft Dynamics 365 (Power Apps) via the Power Apps Component Framework (PCF). It displays an active Case and its relational web of Persons, connected Entities (Case Entities), and Evidence in a force-directed network graph.

## Project Structure

The project was constructed in two layered environments to support both rapid local UI development and Dataverse deployment:

1. **Local Vite Environment (`/Nexus-investigation-board`)**
   A standard Vite + React application used for isolated UI/UX development, CSS styling, and D3 graph testing using a local mock dataset.
2. **PCF Component Container (`/NexusBoard` & `/Solution`)**
   The Power Apps Component Framework wrapper that mounts the React app, accepts standard Dataverse parameters, and pulls live Dynamics 365 data via `context.webAPI`.

```text
d:\ncs-nexus-investigation-board\
├── Nexus-investigation-board/      ← Local Dev (Vite app, mock data)
├── NexusBoard/                     ← PCF Control Source (React + index.ts wrapper)
├── Solution/                       ← MSBuild CDS Solution (.cdsproj)
│   └── bin/Debug/Solution.zip      ← Deployable Dataverse Archive
├── ncs-nexus-investigation-board.pcfproj
└── package.json (root)             ← Dependencies (React 18, D3, pcf-scripts)
```

---

## 1. Data Model & Entity Types (`types/index.ts`)

The graph maps directly to four core Dataverse tables using the `cr1da_` publisher prefix.

*   `case` (`cr1da_case`): The central record (Incident). Displays Case Number, Name, Status.
*   `person` (`cr1da_person`): Individuals linked to Case Entities. Captures DOB, Phone, and Suspect status.
*   `caseEntity` (`cr1da_caseentity`): Middle-tier associations linking a Case to a Person or abstract entities (Vehicles, Properties).
*   `evidence` (`cr1da_evidence`): Artifacts supporting the case, linked directly to the Case or a specific Case Entity.

### UI Avatars & styling (`utils/constants.ts`)
Each entity type has distinct styling to aid rapid visual parsing:
*   **Case:** Red (`#ff5f5f`), Folder icon 📁, Size 36
*   **Person:** Orange (`#ff9040`), User icon 👤, Size 24
*   **Case Entity:** Yellow (`#f0d040`), Link icon 🔗, Size 18
*   **Evidence:** Green (`#3ed98a`), Clip icon 📎, Size 20

---

## 2. Core Components

### `App.tsx` (Root UI Container)
The core React app accepts optional `graphData` and `webAPI` props. If executed within PCF, it receives live data. If executed locally via Vite, it falls back to `MOCK_GRAPH_DATA`. It manages active filters, sidebar visibility, and node selection state.

### `GraphCanvas.tsx` & `useD3Graph.ts` (Visualization)
Built using `d3-force`. The hook handles:
1.  **Simulation:** Forces for collision, many-body charge repel, and center positioning.
2.  **Zoom/Pan:** `d3-zoom` behavior bound to the SVG container.
3.  **Drawing:** Renders links (lines with optional arrows/labels) and nodes (circles + text + emoji icons based on type).
4.  **Interactivity:** Hover effects (highlighting connected edges), drag-and-drop node pinning (`d3-drag`), and click-to-select.

### `EntitySidebar.tsx` (Context Panel)
A sliding right-hand panel that reacts to the current `selectedNode`. It displays the detailed meta-information of the node (e.g., "Date of Birth" for Persons, "Collected Date" for Evidence). It delegates rendering to `EntityDetailContent.tsx` based on the node's `kind`.

---

## 3. Dataverse Integration (`dataverse.ts`)

When mounted in Dynamics 365, the PCF wrapper (`index.ts`) executes `fetchGraphData(context.webAPI, caseId)`.

### Query Execution
It executes parallel OData queries against the PCF `webAPI` object:
1.  **Retrieve Case** (by ID).
2.  **Retrieve Multiple `caseEntity`** filtered by `_cr1da_case_value eq 'caseId'`.
3.  **Retrieve Multiple `evidence`** filtered by `_cr1da_case_value eq 'caseId'`.
4.  **Retrieve Multiple `person`** (Constructs a dynamic `$filter` query using the lookup IDs gathered from the Case Entities).

### Data Mapping (`mapToGraphData`)
Transforms the raw Dataverse JSON records into the expected `GraphData` format:
*   **Nodes:** Constructs standard `GraphNode` objects. Sets metadata into the `details` generic payload. Maps Dataverse GUIDs directly into the `id` field.
*   **Links:** Generates `GraphLink` objects based on the lookup fields (e.g., links an Evidence node to a Case node because `_cr1da_case_value` is populated).

---

## 4. PCF Wrapper (`index.ts`)

The `InvestigationBoard` class implements standard PCF interfaces.
1.  **`init()`**: Called by Dynamics 365 on load. Captures the bound `caseId` property. Mounts a React 18 root using `ReactDOM.createRoot()`. Triggers `fetchGraphData()`.
2.   **`updateView()`**: Triggered by Dataverse state changes. If the `caseId` changes (unlikely on a static form, but handled), it re-fetches Dataverse data and triggers a React render cycle.
3.  **`destroy()`**: Unmounts the React root to prevent memory leaks when navigating away from the Case form.

---

## 5. Build & Deployment Process

### Prerequisites installed in `package.json`:
*   React 18 & ReactDOM 18 (PCF compatibility standard)
*   D3 (^7.8.5)
*   Power Apps CLI (`pac`)

### Compilation Commands (`d:\ncs-nexus-investigation-board`):
1.  `npm run build`: Compiles TypeScript/TSX, validates the `ControlManifest.Input.xml`, and bundles the payload using Webpack via `pcf-scripts`.
2.  `pac solution init`: (Inside `Solution/`) Scaffolds the Dataverse MSBuild project.
3.  `pac solution add-reference`: Links the PCF project to the Solution project.
4.  `dotnet build`: MSBuild compiles the referenced PCF project and compresses it into a Dataverse-compliant `Solution.zip`.

### Final Artefact
`d:\ncs-nexus-investigation-board\Solution\bin\Debug\Solution.zip`
