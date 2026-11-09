"use client";

import { useSyncExternalStore } from "react";

import { isFixtureMode } from "@/lib/api";

const noop = () => () => {};

/**
 * Whether calls go to fixtures. Reads a cookie, so the server render returns
 * null and the client fills it in after hydration without a mismatch.
 * The mode only changes on a full reload, so there is nothing to subscribe to.
 */
export function useFixtureMode(): boolean | null {
  return useSyncExternalStore(noop, isFixtureMode, () => null);
}
