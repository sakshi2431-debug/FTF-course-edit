import { useEffect, useMemo, useRef, useState } from "react";
import { setConnection } from "../mock/engine";
import { resetScenario, selectScenario, useActiveScenario } from "../scenarios/load";
import { AREAS, findScenario, SCENARIOS, type Area } from "../scenarios/registry";
import { useAppState } from "../state/store";

/* A developer tool, styled unlike the product so nobody mistakes it for a feature. */
export function ScenarioSwitcher() {
  const scenarioId = useActiveScenario();
  const { conn } = useAppState();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);
  const requested = new URLSearchParams(window.location.search).get("scenario");
  const active = findScenario(scenarioId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.code === "KeyS") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) search.current?.focus();
    else if (wasOpen.current) toggle.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (Object.keys(AREAS) as Area[])
      .map((area) => ({
        area,
        all: SCENARIOS.filter((s) => s.area === area),
        shown: SCENARIOS.filter(
          (s) =>
            s.area === area &&
            (!term ||
              s.id.toLowerCase().includes(term) ||
              s.title.toLowerCase().includes(term) ||
              AREAS[area].toLowerCase().includes(term)),
        ),
      }))
      .filter((group) => group.shown.length > 0);
  }, [query]);

  const builtCount = SCENARIOS.filter((s) => s.built).length;

  return (
    <div className="sw" data-testid="switcher">
      {open && (
        <section className="sw-panel" aria-label="Scenario switcher">
          <div className="sw-header">
            <div>
              <p className="sw-title">Scenarios</p>
              <p className="sw-note">
                Prototype tool, not part of the product · {builtCount} of{" "}
                {SCENARIOS.length} built
              </p>
            </div>
          </div>
          <div className="sw-active">
            <span data-testid="active-scenario">
              Active: <strong>{active?.id ?? "None"}</strong>
            </span>
            <button type="button" className="sw-action" onClick={resetScenario}>
              Reset scenario
            </button>
          </div>
          {active && (
            <p className="sw-hint" data-testid="scenario-hint">
              <strong>Try:</strong> {active.trigger}
              <br />
              <strong>Expect:</strong> {active.see}
              <br />
              <strong>Figma:</strong> {active.source}
            </p>
          )}
          <label className="sw-offline">
            <input
              type="checkbox"
              checked={conn === "offline"}
              data-testid="simulate-offline"
              onChange={(event) =>
                setConnection(event.target.checked ? "offline" : "online")
              }
            />
            Simulate offline
          </label>
          {requested && !active && (
            <p className="sw-warning">
              No scenario called {requested}. Showing the base course.
            </p>
          )}
          <input
            ref={search}
            className="sw-search"
            type="search"
            placeholder="Search by ID or name"
            aria-label="Search scenarios"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="sw-list">
            {groups.map(({ area, all, shown }) => (
              <div key={area} className="sw-group">
                <p className="sw-group-title">
                  {AREAS[area]}{" "}
                  <span>
                    {all.filter((s) => s.built).length}/{all.length}
                  </span>
                </p>
                {shown.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    className="sw-row"
                    aria-current={scenario.id === scenarioId ? "true" : undefined}
                    data-scenario={scenario.id}
                    onClick={() => selectScenario(scenario.id)}
                  >
                    <span className="sw-id">{scenario.id}</span>
                    <span className="sw-name">{scenario.title}</span>
                    <span className={`sw-chip ${scenario.built ? "built" : ""}`}>
                      {scenario.built ? "Built" : `Phase ${scenario.phase}`}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {groups.length === 0 && (
              <p className="sw-note">No scenarios match your search.</p>
            )}
          </div>
        </section>
      )}
      <button
        ref={toggle}
        type="button"
        className="sw-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Scenarios{active ? ` · ${active.id}` : ""}
        <kbd>Alt+S</kbd>
      </button>
    </div>
  );
}
