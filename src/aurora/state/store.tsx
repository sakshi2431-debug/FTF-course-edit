import { useSyncExternalStore } from "react";
import { createBaseState } from "../mock/course";
import { reducer, type Action } from "./reducer";
import type { AppState } from "./types";

/* A small store, so the mock engine can read the latest state from its timers. */
let state: AppState = createBaseState();
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  dispatch(action: Action) {
    state = reducer(state, action);
    listeners.forEach((listener) => listener());
  },
  set(fn: (current: AppState) => AppState) {
    store.dispatch({ type: "UPDATE", fn });
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.get);
}
