"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Calculator01Icon, Target02Icon, ViewIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TESTED_CUT_KEY } from "@/configs/insights";
import { setLocalFlag } from "@/hooks/use-local-flag";
import { asApiError, useResource } from "@/hooks/use-resource";
import { api, isFixtureMode, type ApiError } from "@/lib/api";
import type { Scenario } from "@/types/api";
import { monthToRange } from "@/utils/dates";
import { formatMonth } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";
import { MonthSelect } from "../shared/month-select";
import { tabList, tabTrigger } from "../shared/tab-trigger";
import { PlanSkeleton } from "../skeletons";
import { CUT_FORM_ID, CutBuilder, anyInvalidCut } from "./cut-builder";
import { GoalCard } from "./goal-card";
import { Protections } from "./protections";
import { SavedScenarios } from "./saved-scenarios";
import { ScenarioResultDialog } from "./scenario-result";

/** Sample mode answers in a blink; hold the loading state long enough to read. */
const SAMPLE_MIN_WAIT_MS = 1200;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Tab = "cut" | "goal";

export function PlanScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const month = params.get("month");
  const analysis = useResource(() => api.analysis({ ...monthToRange(month) }), `plan|${month}`);
  const [cuts, setCuts] = useState<Record<string, string>>({});
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [lastCuts, setLastCuts] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [open, setOpen] = useState(false);
  const [savedVersion, setSavedVersion] = useState(0);
  // Lives here, not in GoalCard, so it survives switching tabs.
  const [target, setTarget] = useState("");
  const tab: Tab = params.get("tab") === "goal" ? "goal" : "cut";

  function setTab(value: "goal" | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("tab", value);
    else next.delete("tab");
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  const a = analysis.data;
  const current = month ?? a?.range.start.slice(0, 7) ?? "";
  // A result only belongs to the month it was calculated for.
  const shown = scenario && scenario.range.start.slice(0, 7) === current ? scenario : null;
  const stale = Boolean(shown) && JSON.stringify(cuts) !== lastCuts;
  const invalid = anyInvalidCut(cuts);

  async function calculate() {
    if (!a) return;
    setBusy(true);
    setError(null);
    setOpen(true);
    const list = a.categories
      .filter((c) => !c.protected)
      .map((c) => ({ category: c.category, percent: Number(cuts[c.category] || 0) }))
      .filter((c) => c.percent > 0);
    try {
      const [result] = await Promise.all([
        api.createScenario({ range: a.range, cuts: list }),
        isFixtureMode() ? wait(SAMPLE_MIN_WAIT_MS) : null,
      ]);
      setScenario(result);
      setLastCuts(JSON.stringify(cuts));
      setLocalFlag(TESTED_CUT_KEY, true);
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (analysis.error) return <ErrorNotice error={analysis.error} onRetry={analysis.reload} />;
  if (!a) return <PlanSkeleton />;
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
      <Tabs value={tab} onValueChange={(v) => setTab(v === "goal" ? "goal" : null)} className="gap-3">
        <TabsList className={tabList}>
          <TabsTrigger value="cut" className={tabTrigger}>
            <Icon icon={Calculator01Icon} />
            Plan a cut
          </TabsTrigger>
          <TabsTrigger value="goal" className={tabTrigger}>
            <Icon icon={Target02Icon} />
            Goal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cut">
          <div className="grid items-start gap-3 lg:grid-cols-[1fr_1.4fr]">
            <Protections
              analysis={a}
              onChanged={async () => {
                await analysis.reload();
                setScenario(null);
              }}
            />
            <CutBuilder analysis={a} cuts={cuts} setCuts={setCuts} onCalculate={calculate} />
          </div>

          <div className="mt-5 flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="submit"
                form={CUT_FORM_ID}
                size="lg"
                className="min-w-52 shadow-md shadow-brand/25"
                disabled={busy || invalid}
              >
                {busy ? <Spinner /> : <Icon icon={Calculator01Icon} />}
                {busy ? "Calculating…" : stale ? "Recalculate" : "Calculate"}
              </Button>
              {shown && !stale && !busy && (
                <Button size="lg" variant="outline" onClick={() => setOpen(true)}>
                  <Icon icon={ViewIcon} />
                  View result
                </Button>
              )}
            </div>
            {invalid && <p className="text-[12.5px] text-destructive">Fix the highlighted percentages first.</p>}
          </div>

          <div className="mt-5">
            <SavedScenarios version={savedVersion} />
          </div>
        </TabsContent>

        <TabsContent value="goal">
          <GoalCard scenario={shown} stale={stale} target={target} setTarget={setTarget} onEditCut={() => setTab(null)} />
        </TabsContent>
      </Tabs>

      <ScenarioResultDialog
        open={open}
        onOpenChange={setOpen}
        scenario={shown}
        busy={busy}
        error={error}
        onRetry={calculate}
        month={current}
        onSaved={() => setSavedVersion((v) => v + 1)}
      />
    </>
  );
}
