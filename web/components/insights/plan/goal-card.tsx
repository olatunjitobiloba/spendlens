"use client";

import { useState } from "react";
import { Target02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import type { GoalProjection } from "@/types/api";

const INITIAL_PROJECTION: GoalProjection = {
  goal_name: "Emergency fund",
  months_to_goal: 10,
  final_balance_kobo: 50_000_000,
  annual_rate_pct: 0,
  note: "Projection uses the rate you entered. It is an assumption, not a forecast or advice.",
};

export function GoalCard({
  defaultMonthlySavingKobo = 0,
  className,
}: {
  defaultMonthlySavingKobo?: number;
  className?: string;
}) {
  const [goalName, setGoalName] = useState("Emergency fund");
  const [targetNaira, setTargetNaira] = useState("500000");
  const [savedNaira, setSavedNaira] = useState("0");
  const [monthlyNaira, setMonthlyNaira] = useState(
    defaultMonthlySavingKobo > 0 ? String(Math.round(defaultMonthlySavingKobo / 100)) : "50000",
  );
  const [prevDefault, setPrevDefault] = useState(defaultMonthlySavingKobo);
  const [ratePct, setRatePct] = useState("");
  const [projection, setProjection] = useState<GoalProjection | null>(INITIAL_PROJECTION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync monthly savings prop change during render per React guidelines
  if (defaultMonthlySavingKobo !== prevDefault) {
    setPrevDefault(defaultMonthlySavingKobo);
    if (defaultMonthlySavingKobo > 0) {
      setMonthlyNaira(String(Math.round(defaultMonthlySavingKobo / 100)));
    }
  }

  async function calculate() {
    const target = Math.round(Number(targetNaira.replace(/,/g, "")) * 100);
    const saved = Math.round(Number(savedNaira.replace(/,/g, "")) * 100);
    const monthly = Math.round(Number(monthlyNaira.replace(/,/g, "")) * 100);
    const rate = ratePct.trim() ? Number(ratePct) : 0;

    if (!goalName.trim()) {
      setError("Please enter a goal name.");
      return;
    }
    if (isNaN(target) || target <= 0) {
      setError("Target amount must be greater than 0.");
      return;
    }
    if (isNaN(saved) || saved < 0) {
      setError("Saved amount cannot be negative.");
      return;
    }
    if (isNaN(monthly) || monthly < 0) {
      setError("Monthly saving cannot be negative.");
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Rate must be between 0 and 100%.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await api.projectGoal({
        goal_name: goalName.trim(),
        target_kobo: target,
        saved_kobo: saved,
        monthly_saving_kobo: monthly,
        annual_rate_pct: rate,
      });
      setProjection(res);
    } catch {
      setError("Could not calculate goal projection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <Icon icon={Target02Icon} className="text-brand size-4.5" />
          Savings Goal
        </span>
      }
      description="See how your monthly cuts turn into long-term savings."
      className={className}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="goal-name" className="block text-[12.5px] font-medium text-t2">
              Goal name
            </label>
            <input
              id="goal-name"
              type="text"
              value={goalName}
              maxLength={60}
              placeholder="e.g. Laptop, Rent deposit"
              onChange={(e) => setGoalName(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-panel px-3 text-[13px] outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="goal-target" className="block text-[12.5px] font-medium text-t2">
                Target (₦)
              </label>
              <input
                id="goal-target"
                type="text"
                inputMode="numeric"
                value={targetNaira}
                placeholder="500,000"
                onChange={(e) => setTargetNaira(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-panel px-3 font-mono text-[13px] outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="goal-saved" className="block text-[12.5px] font-medium text-t2">
                Already saved (₦)
              </label>
              <input
                id="goal-saved"
                type="text"
                inputMode="numeric"
                value={savedNaira}
                placeholder="0"
                onChange={(e) => setSavedNaira(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-panel px-3 font-mono text-[13px] outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="goal-monthly" className="block text-[12.5px] font-medium text-t2">
                Monthly saving (₦)
              </label>
              <input
                id="goal-monthly"
                type="text"
                inputMode="numeric"
                value={monthlyNaira}
                placeholder="50,000"
                onChange={(e) => setMonthlyNaira(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-panel px-3 font-mono text-[13px] outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="goal-rate" className="block text-[12.5px] font-medium text-t2">
                Assumed return % <span className="text-t4">(optional)</span>
              </label>
              <input
                id="goal-rate"
                type="text"
                inputMode="decimal"
                value={ratePct}
                placeholder="0"
                onChange={(e) => setRatePct(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-panel px-3 font-mono text-[13px] outline-none focus:border-brand"
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          <Button size="sm" onClick={calculate} disabled={busy} className="w-full">
            {busy ? <Spinner /> : "Update projection"}
          </Button>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-panel-raised/60 p-4 border border-line">
          <div>
            <p className="text-[11.5px] font-medium tracking-wide uppercase text-t4">Projected timeline</p>
            {projection ? (
              <div className="mt-2">
                {projection.months_to_goal === 0 ? (
                  <p className="text-[26px] font-[700] text-positive">Goal reached</p>
                ) : projection.months_to_goal !== null ? (
                  <>
                    <p className="text-[34px] font-[700] tracking-tight text-foreground">
                      {projection.months_to_goal}{" "}
                      <span className="text-[18px] font-medium text-t3">
                        {projection.months_to_goal === 1 ? "month" : "months"}
                      </span>
                    </p>
                    <p className="mt-1 text-[13px] text-t3">
                      Final balance: <Money kobo={projection.final_balance_kobo} className="font-semibold text-foreground" />
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[22px] font-[600] text-warn">Over 50 years</p>
                    <p className="mt-1 text-[12.5px] text-t3">Increase monthly savings to reach this goal sooner.</p>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-t3">Calculate to see projection.</p>
            )}
          </div>

          {projection?.note && (
            <p className="mt-4 border-t border-line/60 pt-3 text-[11px] leading-relaxed text-t4">
              {projection.note}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
