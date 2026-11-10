"use client";

import { signOut } from "@/actions/auth";
import { STORAGE_PREFIX } from "@/configs/insights";
import { setFixtureOverride } from "@/lib/api";

/** Log out clears local state too (technical doc §13). */
export async function signOutAndClear() {
  await signOut();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    // Storage blocked: nothing to clear.
  }
  // Full load on purpose: proxy.ts must see the cleared session cookie.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}

/** Switch between sample data and the live API. A reload lets proxy.ts re-check. */
export function switchMode(fixtures: boolean) {
  setFixtureOverride(fixtures);
  window.location.reload();
}
