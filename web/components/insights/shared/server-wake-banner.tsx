"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { api, isFixtureMode } from "@/lib/api";

const WAKE_NOTICE_DELAY_MS = 4_000;

/** Wakes a cold-started live backend on mount and warns after ~4s if it is still starting. */
export function ServerWakeBanner() {
  const [slow, setSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isFixtureMode()) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => setSlow(true), WAKE_NOTICE_DELAY_MS);

    api
      .health(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setSlow(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSlow(false);
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <div role="status" aria-live="polite">
      {slow && !dismissed && (
        <Notice
          tone="warn"
          className="mb-4"
          title="Waking the server"
          action={
            <Button
              size="sm"
              variant="ghost"
              aria-label="Dismiss server wake-up notice"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          }
        >
          This can take up to a minute.
        </Notice>
      )}
    </div>
  );
}
