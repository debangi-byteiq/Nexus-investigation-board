import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "./App";
import { fetchGraphData, DataverseWebAPI } from "./data/dataverse";
import type { GraphData } from "./types";

/**
 * PCF wrapper for the NEXUS Investigation Board.
 *
 * Lifecycle:
 *   init()       → create React root, fetch Dataverse data, render <App>
 *   updateView() → re-fetch if caseId changes
 *   destroy()    → unmount React root
 */
export class InvestigationBoard
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container!: HTMLDivElement;
  private _root!: ReactDOM.Root;
  private _currentCaseId: string | null = null;

  constructor() {
    // no-op
  }

  public init(
    context: ComponentFramework.Context<IInputs>,
    _notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._container.style.width = "100%";
    this._container.style.height = "100%";

    this._root = ReactDOM.createRoot(this._container);

    // Initial render with the case ID from the bound property
    const caseId = context.parameters.caseId?.raw ?? null;
    if (caseId) {
      this._currentCaseId = caseId;
      this._fetchAndRender(context.webAPI as unknown as DataverseWebAPI, caseId);
    } else {
      this._renderEmpty();
    }
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    const caseId = context.parameters.caseId?.raw ?? null;

    // Only re-fetch when the caseId actually changes
    if (caseId && caseId !== this._currentCaseId) {
      this._currentCaseId = caseId;
      this._fetchAndRender(context.webAPI as unknown as DataverseWebAPI, caseId);
    }
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    this._root?.unmount();
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async _fetchAndRender(
    webAPI: DataverseWebAPI,
    caseId: string
  ): Promise<void> {
    // Show loading state
    this._root.render(
      React.createElement(App, { loading: true, graphData: null, webAPI })
    );

    try {
      const graphData: GraphData = await fetchGraphData(webAPI, caseId);
      this._root.render(
        React.createElement(App, { loading: false, graphData, webAPI })
      );
    } catch (err) {
      console.error("[NexusBoard] Error fetching graph data:", err);
      this._root.render(
        React.createElement(App, {
          loading: false,
          graphData: null,
          webAPI,
          error: String(err),
        })
      );
    }
  }

  private _renderEmpty(): void {
    this._root.render(
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#888",
            fontFamily: "Segoe UI, sans-serif",
            fontSize: "14px",
          },
        },
        "No Case ID bound. Please configure the control on the Case form."
      )
    );
  }
}
