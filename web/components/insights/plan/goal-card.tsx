"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import type { Scenario } from "@/types/api";
import { cn } from "@/utils/cn";
import { fmtWhole } from "@/utils/format";
import { MAX_TARGET_KOBO, monthsToGoal, parseNairaToKobo } from "@/utils/goal";

const INPUT_ID = "goal-target";
const TITLE_ID = "goal-title";

/**
 * Turns the calculated cut into a goal timeline: the scenario's monthly saving
 * against a target the user types. Needs a fresh scenario to work from.
 */
export function GoalCard({
  scenario,
  stale,
  target,
  setTarget,
  onEditCut,
}: {
  scenario: Scenario | null;
  stale: boolean;
  target: string;
  setTarget: (v: string) => void;
  onEditCut: () => void;
}) {
  const parsed = parseNairaToKobo(target);
  const tooBig = parsed !== null && parsed > MAX_TARGET_KOBO;
  const targetKobo = tooBig ? null : parsed;
  const bad = target.trim() !== "" && targetKobo === null;
  const monthly = scenario?.total_reduction_kobo ?? 0;
  const ready = !!scenario && !stale && monthly > 0;
  const months = ready && targetKobo !== null ? monthsToGoal(targetKobo, monthly) : null;
  // The ring shows how much of the target one month of the cut covers.
  const share = months ? 1 / months : 0;

  const message = !scenario
    ? "Calculate a cut first. The goal uses what that cut saves each month."
    : stale
      ? "Your cuts changed. Recalculate to update the goal."
      : monthly <= 0
        ? "This scenario saves nothing yet. Add a cut to start moving."
        : months === null
          ? "Enter a target below to see when your cut gets you there."
          : months === 1
            ? "One month of this cut covers it. Nice."
            : "Keep the cut going and you'll reach your target.";

  return (
    <section
      aria-labelledby={TITLE_ID}
      className="w-full rounded-[1.25rem] border border-line bg-panel"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
        <h2 id={TITLE_ID} className="text-[12px] font-semibold tracking-[0.08em] text-t3 uppercase">
          Goal
        </h2>
        <button
          type="button"
          onClick={onEditCut}
          className="inline-flex items-center gap-0.5 rounded-md text-[13px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Edit cut
          <Icon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2.2} />
        </button>
      </header>

      <div className="flex flex-col items-center px-4 pt-8 pb-6 text-center sm:px-5" aria-live="polite">
        <div className="grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="pb-1 text-left">
            <p className="text-[11.5px] text-t4">Each month</p>
            <p className="mt-0.5 text-[14px] font-semibold">{ready ? <Money kobo={monthly} /> : "—"}</p>
          </div>
          <TargetRing share={share} muted={!ready} />
          <div className="pb-1 text-right">
            <p className="text-[11.5px] text-t4">Target</p>
            <p className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums">
              {targetKobo !== null ? fmtWhole(targetKobo) : "—"}
            </p>
          </div>
        </div>

        {months !== null && (
          <p className="mt-6 text-[28px] leading-none font-semibold tracking-[-0.02em]">
            <span className="font-mono tabular-nums">{months}</span>{" "}
            <span className="text-[17px] font-medium text-t3">{months === 1 ? "month" : "months"}</span>
          </p>
        )}
        <p className={cn("max-w-sm text-[14px] leading-relaxed text-t3", months !== null ? "mt-2" : "mt-6")}>
          {message}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <label htmlFor={INPUT_ID} className="text-[13px] font-medium text-t2">
          Target amount
        </label>
        <div className="sm:w-52">
          <span className="relative block">
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
              {tooBig
                ? `The most you can set is ${fmtWhole(MAX_TARGET_KOBO)}.`
                : "Use an amount like 150000 or 150,000.50."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Decorative target. The outer arc fills with one month's share of the goal. */
function TargetRing({ share, muted }: { share: number; muted: boolean }) {
  const r = 60;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, share));

  return (
    <svg viewBox="0 0 132 132" aria-hidden="true" className={cn("size-32 transition-opacity", muted && "opacity-50")}>
      <circle cx="66" cy="66" r={r} fill="none" strokeWidth="6" className="stroke-foreground/6" />
      <circle
        cx="66"
        cy="66"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 66 66)"
        className={cn("stroke-brand transition-[stroke-dashoffset] duration-700 ease-out", pct === 0 && "opacity-0")}
      />
      <circle cx="66" cy="66" r="46" className="fill-brand/10" />
      <circle cx="66" cy="66" r="34" fill="none" strokeWidth="5" className="stroke-brand/35" />
      <circle cx="66" cy="66" r="20" fill="none" strokeWidth="5" className="stroke-brand/70" />
      <circle cx="66" cy="66" r="7" className="fill-brand" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 102 L64 68 M53 66 H66 V79" strokeWidth="8" className="stroke-panel" />
        <path d="M30 102 L64 68 M53 66 H66 V79" strokeWidth="3.5" className="stroke-foreground" />
      </g>
    </svg>
  );
}
