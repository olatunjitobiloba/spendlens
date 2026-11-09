"use client";

import Link from "next/link";
import { Crown02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { useIsPro } from "@/providers/me-provider";
import type { Comparison } from "@/types/api";
import { formatRange } from "@/utils/format";

const word = (n: number) => (n > 0 ? "Up" : n < 0 ? "Down" : "Same");

/** Month-over-month comparison (Pro). Every delta comes from the API. */
export function ComparisonCard({ comparison }: { comparison: Comparison | null }) {
  const isPro = useIsPro();

  if (!isPro) {
    return (
      <Section title="Compared with last month" aside={<Status tone="brand">Pro</Status>}>
        <p className="text-[13.5px] text-t3">See which categories went up or down against the month before, line by line.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/insights/pro">
            <Icon icon={Crown02Icon} />
            Unlock with Pro
          </Link>
        </Button>
      </Section>
    );
  }
  if (!comparison) return null;

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
        {comparison.categories.slice(0, 6).map((r) => (
          <li key={r.category} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 text-[13.5px]">
            <span className="min-w-0 truncate">{r.category}</span>
            <span className="flex items-center gap-2">
              <Status tone={r.change_kobo > 0 ? "warn" : r.change_kobo < 0 ? "positive" : "neutral"}>
                {word(r.change_kobo)}
                {r.change_pct !== null && r.change_kobo !== 0 ? ` ${Math.abs(r.change_pct)}%` : ""}
                {r.change_pct === null && r.change_kobo !== 0 ? " (new)" : ""}
              </Status>
              <Money kobo={Math.abs(r.change_kobo)} className="w-28 text-right text-[12.5px] text-t2" />
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
