"use client";

import { useCallback, useSyncExternalStore } from "react";

// Per-viewer UI conveniences only (a collapsed sidebar, a dismissed card).
// Never business state: that lives in the API.

const EVENT = "spendlens:local-flag";

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function setLocalFlag(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    // Storage blocked: the flag just does not persist.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** A boolean kept in localStorage. Server render and first paint use `fallback`. */
export function useLocalFlag(key: string, fallback = false): [boolean, (on: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => fallback,
  );
  const set = useCallback((on: boolean) => setLocalFlag(key, on), [key]);
  return [value, set];
}
