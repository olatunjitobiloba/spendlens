"use client";

import { SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import type { Analysis } from "@/types/api";
import { cn } from "@/utils/cn";

const QUICK = [0, 10, 20, 30];
/** Whole number from 0 to 100, as the API requires. Input validation only. */
export const isValidPercent = (v: string) => v === "" || /^(100|[1-9]?\d)$/.test(v);

export function CutBuilder({
  analysis,
  cuts,
  setCuts,
  onCalculate,
  busy,
  stale,
}: {
  analysis: Analysis;
  cuts: Record<string, string>;
  setCuts: (c: Record<string, string>) => void;
  onCalculate: () => void;
  busy: boolean;
  stale: boolean;
}) {
  const flexible = analysis.categories.filter((c) => !c.protected);
  const protectedCats = analysis.categories.filter((c) => c.protected);
  const anyInvalid = Object.values(cuts).some((v) => !isValidPercent(v));

  return (
    <Section title="Test a cut" description="Pick a whole-number percent for each category you could spend less on.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!anyInvalid) onCalculate();
        }}
      >
        <ul className="space-y-2">
          {flexible.map((c) => {
            const id = `cut-${c.category.replace(/\W+/g, "-")}`;
            const value = cuts[c.category] ?? "";
            const bad = !isValidPercent(value);
            const isOn = (p: number) => value === String(p) || (p === 0 && value === "");
            return (
              <li key={c.category} className="rounded-xl bg-panel-raised/50 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <label htmlFor={id} className="min-w-0">
                    <span className="block text-[13.5px] font-medium">{c.category}</span>
                    <Money kobo={c.total_kobo} className="text-[12px] text-t3" />
                  </label>
                  <span className="flex items-center gap-1.5">
                    {QUICK.map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-label={`Cut ${c.category} by ${p}%`}
                        aria-pressed={isOn(p)}
                        onClick={() => setCuts({ ...cuts, [c.category]: p ? String(p) : "" })}
                        className={cn(
                          "hidden h-7 rounded-full px-2 font-mono text-[11.5px] sm:inline-block",
                          isOn(p) ? "bg-foreground text-background" : "text-t3 hover:bg-foreground/[0.06]",
                        )}
                      >
                        {p}%
                      </button>
                    ))}
                    <span className="relative">
                      <input
                        id={id}
                        inputMode="numeric"
                        value={value}
                        placeholder="0"
                        aria-invalid={bad}
                        aria-describedby={bad ? `${id}-err` : undefined}
                        onChange={(e) => setCuts({ ...cuts, [c.category]: e.target.value.trim() })}
                        className={cn(
                          "h-8 w-16 rounded-lg border bg-panel pr-6 pl-2 text-right font-mono text-[13px]",
                          bad ? "border-destructive" : "border-line-strong",
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[12px] text-t3"
                      >
                        %
                      </span>
                    </span>
                  </span>
                </div>
                {bad && (
                  <p id={`${id}-err`} className="mt-1 text-[12px] text-destructive">
                    Use a whole number from 0 to 100.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {protectedCats.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[12.5px] text-t3">
            <Icon icon={SquareLock02Icon} className="size-3.5" />
            Not cut: {protectedCats.map((c) => c.category).join(", ")}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={busy || anyInvalid}>
            {busy ? "Calculating…" : stale ? "Recalculate" : "Calculate"}
          </Button>
          {stale && !busy && <span className="text-[12.5px] text-warn">Inputs changed since the last result.</span>}
        </div>
      </form>
    </Section>
  );
}
