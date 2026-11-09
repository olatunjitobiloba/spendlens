"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { TESTED_CUT_KEY } from "@/configs/insights";
import { setLocalFlag } from "@/hooks/use-local-flag";
import { asApiError, useResource } from "@/hooks/use-resource";
import { api, type ApiError } from "@/lib/api";
import type { Scenario } from "@/types/api";
import { monthToRange } from "@/utils/dates";
import { formatMonth } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";
import { MonthSelect } from "../shared/month-select";
import { CutBuilder } from "./cut-builder";
import { Protections } from "./protections";
import { SavedScenarios } from "./saved-scenarios";
import { ScenarioResult } from "./scenario-result";

export function PlanScreen() {
  const params = useSearchParams();
  const month = params.get("month");
  const analysis = useResource(() => api.analysis({ ...monthToRange(month) }), `plan|${month}`);
  const [cuts, setCuts] = useState<Record<string, string>>({});
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [lastCuts, setLastCuts] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [savedVersion, setSavedVersion] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const a = analysis.data;
  const current = month ?? a?.range.start.slice(0, 7) ?? "";
  // A result only belongs to the month it was calculated for.
  const shown = scenario && scenario.range.start.slice(0, 7) === current ? scenario : null;

  async function calculate() {
    if (!a) return;
    setBusy(true);
    setError(null);
    const list = a.categories
      .filter((c) => !c.protected)
      .map((c) => ({ category: c.category, percent: Number(cuts[c.category] || 0) }))
      .filter((c) => c.percent > 0);
    try {
      setScenario(await api.createScenario({ range: a.range, cuts: list }));
      setLastCuts(JSON.stringify(cuts));
      setLocalFlag(TESTED_CUT_KEY, true);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start" }));
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (analysis.error) return <ErrorNotice error={analysis.error} onRetry={analysis.reload} />;
  if (!a) return <LoadingBlock label="Loading your categories" rows={6} />;
  if (a.imports.length === 0) {
    return (
      <>
        <PageHeader title="Plan" />
        <EmptyState
          title="Import transactions first"
          action={
            <Button asChild>
              <Link href="/insights/import?sample=1">Try with sample data</Link>
            </Button>
          }
        >
          A scenario needs real totals to work from.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Plan a cut for ${formatMonth(current)}`}
        description="Protect what you can't change, then test a cut on the rest. SpendLens does the maths; nothing is cancelled or moved."
        aside={<MonthSelect months={a.available_months} month={current} />}
      />
      <div className="grid items-start gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Protections
          analysis={a}
          onChanged={async () => {
            await analysis.reload();
            setScenario(null);
          }}
        />
        <div className="space-y-3">
          <CutBuilder
            analysis={a}
            cuts={cuts}
            setCuts={setCuts}
            onCalculate={calculate}
            busy={busy}
            stale={Boolean(shown) && JSON.stringify(cuts) !== lastCuts}
          />
          {error && <ErrorNotice error={error} onRetry={calculate} />}
          <div ref={resultRef} className="scroll-mt-4">
            {shown && (
              <ScenarioResult scenario={shown} month={current} onSaved={() => setSavedVersion((v) => v + 1)} />
            )}
          </div>
          <SavedScenarios version={savedVersion} />
        </div>
      </div>
    </>
  );
}
