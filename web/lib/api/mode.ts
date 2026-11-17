// Live API or fixtures. In fixture mode the axios client swaps its adapter for
// lib/mock/server.ts, which returns the same shapes from synthetic data.

import { MODE_COOKIE, envFixtureMode } from "@/configs/env";
import { API_URL } from "./config";

/**
 * Why live mode can't be switched on in this build, or null when it can.
 * NEXT_PUBLIC_* values are baked in at build time, so changing them needs a
 * dev server restart.
 */
export function liveModeBlocker(): string | null {
  if (!API_URL) return "NEXT_PUBLIC_API_URL isn't set. Add it to web/.env.local and restart the dev server.";
  if (process.env.NEXT_PUBLIC_FIXTURE_MODE === "true")
    return "NEXT_PUBLIC_FIXTURE_MODE is true. Remove it from web/.env.local and restart the dev server.";
  return null;
}

/** True when calls are served from fixtures instead of the live API. */
export function isFixtureMode(): boolean {
  if (envFixtureMode) return true;
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`${MODE_COOKIE}=fixtures`);
}

/** Whether the live API is configured at all, so a switch back makes sense. */
export const liveApiConfigured = Boolean(API_URL);

/** A cookie, so the choice survives reloads and is shared across tabs. */
export function setFixtureOverride(on: boolean) {
  document.cookie = on
    ? `${MODE_COOKIE}=fixtures; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${MODE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
