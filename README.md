# NEXUS Investigation Board

A React + TypeScript PCF (Power Apps Component Framework) component for visualizing Dataverse case entity relationships as an interactive D3.js force graph.

## Project Structure

```
nexus-board/
├── entry/
│   └── main.tsx              # App entry point
├── src/
│   ├── App.tsx               # Root component & state management
│   ├── types/
│   │   └── index.ts          # All TypeScript interfaces & types
│   ├── data/
│   │   └── mockData.ts       # Fabricated Dataverse data (replace with API calls)
│   ├── hooks/
│   │   ├── useD3Graph.ts     # D3 force simulation, rendering, interactions
│   │   ├── useLoadingSequence.ts  # Animated loading steps
│   │   └── useToast.ts       # Toast notification state
│   ├── utils/
│   │   └── constants.ts      # Entity colors, labels, icons, radii
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx    # Dynamics 365 chrome simulation
│   │   │   └── CaseBand.tsx  # Case metadata header strip
│   │   ├── graph/
│   │   │   ├── GraphCanvas.tsx    # SVG wrapper, tooltip, ambient effects
│   │   │   ├── GraphControls.tsx  # Zoom/fit/reheat buttons
│   │   │   ├── SearchBar.tsx      # Entity search input
│   │   │   └── LegendPanel.tsx    # Type legend with filter toggles
│   │   ├── sidebar/
│   │   │   ├── EntitySidebar.tsx        # Slide-in panel container
│   │   │   ├── EntityDetailContent.tsx  # Per-type detail renderer
│   │   │   ├── SidebarFields.tsx        # Field, Section, Timeline, TagRow, NoteBlock
│   │   │   └── RelatedCasesAccordion.tsx # Expandable related cases list
│   │   └── ui/
│   │       ├── LoadingScreen.tsx  # Boot loading animation
│   │       └── Toast.tsx          # Notification toast
│   └── styles/
│       └── main.css          # Complete design system CSS
├── tsconfig.json
└── README.md
```

## Entity Types

| Type       | Shape          | Color    | Description                          |
|------------|----------------|----------|--------------------------------------|
| case       | Hexagon        | #ff5f5f  | Case/Incident record (center node)   |
| contact    | Circle         | #ff9040  | People: suspects, victims, witnesses |
| connection | Pill/Rect      | #f0d040  | Relationship links between entities  |
| annotation | Document rect  | #3ed98a  | Notes, PDFs, images, attachments     |
| related    | Dashed diamond | #4ca8ff  | Links to other related cases         |

## Key Features

- **D3.js force simulation** with per-type shapes, glow filters, arrowheads
- **Neighbourhood highlighting** on node click — non-connected nodes dim
- **Type filter legend** — click to show/hide entity types
- **Live search** across labels/sublabels/types
- **Sidebar** with full Dataverse field details, activity timeline, related cases accordion
- **Zoom/Fit/Reheat** graph controls
- **Loading sequence** simulating parallel Dataverse API queries
- **Fully typed** with TypeScript strict mode

## Integration with Real Dataverse

Replace `src/data/mockData.ts` with actual Dataverse API calls:

```typescript
// Example: fetch contacts linked to case
const contacts = await fetch(
  `/api/data/v9.2/contacts?$filter=_parentcaseid_value eq '${caseId}'`
).then(r => r.json());
```

Map the results to `GraphNode[]` and `GraphLink[]` using the types in `src/types/index.ts`.

## Build

```bash
# With Vite (recommended)
npm install
npm run dev

# Or with esbuild directly
esbuild entry/main.tsx --bundle --outfile=dist/bundle.js \
  --jsx=automatic --jsx-import-source=react
```
