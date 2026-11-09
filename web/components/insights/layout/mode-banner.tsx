"use client";

import { signOut } from "@/actions/auth";
import { Status } from "@/components/ui/status";
import { STORAGE_PREFIX } from "@/configs/insights";
import { useFixtureMode } from "@/hooks/use-fixture-mode";
import { liveApiConfigured, setFixtureOverride } from "@/lib/api";

/** Log out clears local state too (technical doc §13). */
async function signOutAndClear() {
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

function switchMode(fixtures: boolean) {
  setFixtureOverride(fixtures);
  window.location.reload();
}

const linkClass = "underline underline-offset-2 hover:text-foreground";

export function ModeBanner() {
  const fixtures = useFixtureMode();
  if (fixtures === null) return null;

  if (!fixtures) {
    return (
      <p className="text-[12px] text-t4">
        Live API ·{" "}
        <button type="button" className={linkClass} onClick={signOutAndClear}>
          Sign out
        </button>{" "}
        ·{" "}
        <button type="button" className={linkClass} onClick={() => switchMode(true)}>
          use sample mode
        </button>
      </p>
    );
  }

  return (
    <p className="text-[12px] text-t3">
      <Status tone="warn" className="mr-1.5 h-5 px-2 text-[11px]">
        Sample mode
      </Status>
      Synthetic data, kept in this browser.
      {liveApiConfigured && (
        <>
          {" "}
          <button type="button" className={linkClass} onClick={() => switchMode(false)}>
            Use live API
          </button>
        </>
      )}
    </p>
  );
}
