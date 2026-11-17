"use client";

import { setFixtureOverride } from "@/lib/api";

/** Switch between sample data and the live API. A reload re-runs every call in the new mode. */
export function switchMode(fixtures: boolean) {
  setFixtureOverride(fixtures);
  window.location.reload();
}
