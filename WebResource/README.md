# NEXUS Investigation Board Web Resource

This folder contains the standalone HTML Web Resource build of the NEXUS Investigation Board for Dynamics 365 / Power Apps model-driven apps.

## What this does

- Loads on a Case form as an HTML web resource.
- Reads the current Case ID from the page context or web resource `data` parameter.
- Calls `parent.Xrm.WebApi` to fetch related data from Dataverse.
- Renders an interactive D3 relationship graph.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

## Build for Dynamics 365

Use the D365 build command:

```bash
npm run build:d365
```

This creates:

- `dist/index.html` (single-file Vite output)
- `dist/ncs_NexusInvestigationBoard.html` (named artifact for upload)

## Add into Power Apps / D365

1. Open make.powerapps.com and select your target environment.
2. Open or create a solution.
3. Add an existing table form (Case main form) if not already in the solution.
4. Add new Web Resource:
   - Type: `Webpage (HTML)`
   - Name: `ncs_NexusInvestigationBoard.html`
   - Upload file: `dist/ncs_NexusInvestigationBoard.html`
5. Open the Case form designer and insert the web resource into a tab/section.
6. Set Web Resource properties:
   - Pass record object-type code and unique identifier: enabled
   - Custom parameter (`data`) (optional): `id={ID}`
   - Formatting: fill available width/height
7. Save and publish all customizations.

## Required table/column mapping

Update logical names in [src/data/dataverse.ts](src/data/dataverse.ts) if your publisher prefix is not `cr1da_`.

## Notes

- This web resource expects access to `window.parent.Xrm.WebApi`.
- If loaded outside model-driven app context, it falls back to mock rendering.
