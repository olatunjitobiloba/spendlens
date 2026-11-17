"use client";

import { Exchange01Icon } from "@hugeicons/core-free-icons";

import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import type { Comparison } from "@/types/api";
import { formatRange } from "@/utils/format";

const word = (n: number) => (n > 0 ? "Up" : n < 0 ? "Down" : "Same");

/** Month-over-month comparison. Every delta comes from the API. */
export function ComparisonCard({ comparison }: { comparison: Comparison | null }) {
  if (!comparison) {
    return (
      <Section title="Compared with last month" className="flex flex-col">
        <EmptyState icon={Exchange01Icon} title="Nothing to compare yet" className="flex-1 py-8">
          A comparison needs two months of transactions.
        </EmptyState>
      </Section>
    );
  }

  return (
    <Section
      title="Compared with last month"
      description={`Against ${formatRange(comparison.previous_range)}`}
      aside={
        <span className="text-[13px] text-t3">
          {word(comparison.change_kobo)} <Money kobo={Math.abs(comparison.change_kobo)} className="text-foreground" />
        </span>
      }
    >
      <ul className="divide-y divide-line">
        {comparison.categories.slice(0, 5).map((r) => (
          <li key={r.category} className="flex items-center justify-between gap-x-3 py-2.5 text-[13.5px]">
            <span className="min-w-0 truncate">{r.category}</span>
            <span className="flex shrink-0 items-center gap-2">
              <Status tone={r.change_kobo > 0 ? "warn" : r.change_kobo < 0 ? "positive" : "neutral"}>
                {word(r.change_kobo)}
                {r.change_pct !== null && r.change_kobo !== 0 ? ` ${Math.abs(r.change_pct)}%` : ""}
                {r.change_pct === null && r.change_kobo !== 0 ? " (new)" : ""}
              </Status>
              <Money kobo={Math.abs(r.change_kobo)} className="hidden w-28 text-right text-[12.5px] text-t2 sm:inline" />
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
