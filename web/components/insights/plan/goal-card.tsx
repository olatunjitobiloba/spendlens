"use client";

import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import type { Scenario } from "@/types/api";
import { cn } from "@/utils/cn";
import { monthsToGoal, parseNairaToKobo } from "@/utils/goal";

const INPUT_ID = "goal-target";

/**
 * Turns the calculated cut into a goal timeline: the scenario's monthly saving
 * against a target the user types. Needs a fresh scenario to work from.
 */
export function GoalCard({
  scenario,
  stale,
  target,
  setTarget,
}: {
  scenario: Scenario | null;
  stale: boolean;
  target: string;
  setTarget: (v: string) => void;
}) {
  const targetKobo = parseNairaToKobo(target);
  const bad = target.trim() !== "" && targetKobo === null;
  const monthly = scenario?.total_reduction_kobo ?? 0;
  const months = targetKobo !== null ? monthsToGoal(targetKobo, monthly) : null;

  return (
    <Section title="Reach a goal" description="See how long your cut takes to cover something you're saving for.">
      <label htmlFor={INPUT_ID} className="text-[12.5px] text-t3">
        Target amount
      </label>
      <span className="relative mt-1 block max-w-60">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-t3"
        >
          ₦
        </span>
        <input
          id={INPUT_ID}
          inputMode="decimal"
          value={target}
          placeholder="150,000"
          aria-invalid={bad}
          aria-describedby={bad ? `${INPUT_ID}-err` : undefined}
          onChange={(e) => setTarget(e.target.value)}
          className={cn(
            "h-9 w-full rounded-xl border bg-panel pr-3 pl-7 font-mono text-[13px]",
            bad ? "border-destructive" : "border-line-strong",
          )}
        />
      </span>
      {bad && (
        <p id={`${INPUT_ID}-err`} className="mt-1 text-[12px] text-destructive">
          Use an amount like 150000 or 150,000.50.
        </p>
      )}

      <div className="mt-4" aria-live="polite">
        {!scenario ? (
          <p className="text-[13px] text-t3">Calculate a cut first. The goal uses what that cut saves each month.</p>
        ) : stale ? (
          <p className="text-[13px] text-t3">Your cuts changed. Recalculate to update the goal.</p>
        ) : monthly <= 0 ? (
          <p className="text-[13px] text-t3">This scenario saves nothing yet, so no goal can be reached. Add a cut above.</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-panel-raised/60 p-3">
              <dt className="text-[12.5px] text-t3">Saved each month</dt>
              <dd className="mt-1 text-[18px] font-[600]">
                <Money kobo={monthly} />
              </dd>
            </div>
            <div className="rounded-xl bg-foreground p-3 text-background">
              <dt className="text-[12.5px] opacity-75">Time to reach it</dt>
              <dd className="mt-1 text-[18px] font-[600]">
                {months === null ? (
                  <span className="opacity-75">Enter a target</span>
                ) : (
                  <>
                    <span className="font-mono tabular-nums">{months}</span> {months === 1 ? "month" : "months"}
                  </>
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </Section>
  );
}
