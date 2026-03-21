# NEXUS Investigation Board

NEXUS Investigation Board is an interactive relationship graph UI for Dynamics 365 Case investigations, delivered in two component types:

- PCF Custom Component (embedded control on model-driven forms)
- HTML Web Resource (standalone web resource hosted inside model-driven forms)

## Tech Stack

- React: component-based UI framework used to build both PCF and Web Resource frontends.
- TypeScript: strongly typed JavaScript layer used across UI, graph logic, and Dataverse integration.
- D3.js: visualization framework powering force simulation, links, nodes, zoom, and pan behavior.
- Power Apps Component Framework (PCF): framework used to package and host the control inside model-driven forms.
- Dynamics 365 / Dataverse Xrm WebApi: data-access layer used to fetch case-linked records at runtime.
- Vite: fast build tool used for the standalone Web Resource bundle.
- vite-plugin-singlefile: plugin used to export the Web Resource as one deployable HTML file.
- CSS: custom styling system for board layout, graph theming, and sidebar presentation.

## Libraries Used

- react
- react-dom
- d3
- clsx
- tailwind-merge
- lucide-react
- tailwindcss (available in the web resource toolchain)
