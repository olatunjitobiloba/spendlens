"use client";

import { useEffect, useState } from "react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Explanation } from "@/types/api";

type State = { status: "loading" } | { status: "done"; data: Explanation } | { status: "failed" };

/**
 * Fetched after the numbers render, never before (handoff §5). The API call
 * times out at 25 seconds; on failure the numbers stand on their own.
 * Mount with key={scenarioId} so each scenario starts in the loading state.
 */
export function ExplanationPanel({ scenarioId }: { scenarioId: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    api
      .explainScenario(scenarioId, controller.signal)
      .then((data) => setState({ status: "done", data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [scenarioId]);

  return (
    <section
      aria-labelledby="explain-title"
      aria-live="polite"
      className="rounded-2xl border border-line bg-panel-raised/50 p-4"
    >
      <h3 id="explain-title" className="flex items-center gap-1.5 text-[13px] font-[600]">
        <Icon icon={SparklesIcon} className="size-3.5 text-brand" />
        In plain words
      </h3>
      {state.status === "loading" && (
        <div className="mt-2.5 space-y-2">
          <span className="sr-only">Writing an explanation of these numbers</span>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-3/5" />
        </div>
      )}
      {state.status === "failed" && (
        <p className="mt-2 text-[13px] text-t3">
          The explanation is not available right now. The numbers above are complete and do not depend on it.
        </p>
      )}
      {state.status === "done" && (
        <>
          <p className="mt-2 text-[13.5px] leading-relaxed text-t2">{state.data.text}</p>
          <p className="mt-2 text-[11.5px] text-t4">
            {state.data.source === "model"
              ? "Written by AI from the calculated numbers. Every figure was checked against them."
              : "Standard summary of the calculated numbers."}
          </p>
        </>
      )}
    </section>
  );
}
