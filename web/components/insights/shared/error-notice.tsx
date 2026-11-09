"use client";

import Link from "next/link";
import { Refresh01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { ApiError, isFixtureMode, setFixtureOverride } from "@/lib/api";

const titles: Record<string, string> = {
  validation: "That was not accepted",
  not_found: "Not found",
  conflict: "That changed in the meantime",
  server: "Something went wrong on our side",
  aborted: "Cancelled",
};

/** Every error says what happened and what to do next (PRD R6). */
export function ErrorNotice({
  error,
  onRetry,
  className,
}: {
  error: ApiError;
  onRetry?: () => void;
  className?: string;
}) {
  const retry = onRetry && (
    <Button size="sm" variant="outline" onClick={onRetry}>
      <Icon icon={Refresh01Icon} />
      Try again
    </Button>
  );

  if (error.kind === "asleep") {
    const canSwitch = !isFixtureMode();
    return (
      <Notice
        tone="warn"
        className={className}
        title="The SpendLens service is waking up or unreachable"
        action={
          <>
            {retry}
            {canSwitch && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFixtureOverride(true);
                  window.location.reload();
                }}
              >
                Use sample mode
              </Button>
            )}
          </>
        }
      >
        The free server sleeps when idle and can take up to a minute to start. Try again in a moment
        {canSwitch ? ", or continue with synthetic sample data." : "."}
      </Notice>
    );
  }

  if (error.kind === "pro_required") {
    return (
      <Notice
        className={className}
        title="This is part of SpendLens Pro"
        action={
          <Button size="sm" asChild>
            <Link href="/insights/pro">See Pro</Link>
          </Button>
        }
      >
        Unlock it for 30 days through Kora Checkout. Pro switches on only after our server confirms payment.
      </Notice>
    );
  }

  return (
    <Notice tone="danger" className={className} title={titles[error.kind] ?? "Something went wrong"} action={retry}>
      {error.message}
      {error.kind === "server" && " Try again. If it keeps happening, reload the page."}
    </Notice>
  );
}
