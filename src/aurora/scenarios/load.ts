import { useSyncExternalStore } from "react";
import { clearPersisted, loadSnapshot, restorePersisted } from "../mock/engine";
import { createBaseState } from "../mock/course";
import { findScenario } from "./registry";

const idFromUrl = () => new URLSearchParams(window.location.search).get("scenario");

let active: string | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function load(id: string | null) {
  active = id;
  loadSnapshot(findScenario(id)?.start() ?? createBaseState());
  notify();
}

export function selectScenario(id: string) {
  clearPersisted();
  const url = new URL(window.location.href);
  url.searchParams.set("scenario", id);
  url.hash = "";
  window.history.pushState(null, "", url);
  load(id);
}

export function resetScenario() {
  clearPersisted();
  load(idFromUrl());
}

export function initScenarioFromUrl() {
  const id = idFromUrl();
  const scenario = findScenario(id);
  if (scenario?.start().mock.persist && restorePersisted()) {
    active = id;
  } else {
    clearPersisted();
    load(id);
  }
  window.addEventListener("popstate", () => {
    clearPersisted();
    load(idFromUrl());
  });
}

export function useActiveScenario() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => active,
  );
}
