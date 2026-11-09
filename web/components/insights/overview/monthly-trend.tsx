import Link from "next/link";
import { ChartHistogramIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import type { Analysis } from "@/types/api";
import { cn } from "@/utils/cn";
import { fmt, formatMonth } from "@/utils/format";

function Legend() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4 text-[12px] text-t3">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
        Selected
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-foreground/20" />
        Other months
      </span>
    </div>
  );
}

/** Spend per month. Heights come from the API's pct_of_max; select a bar to switch month. */
export function MonthlyTrend({ analysis: a, month }: { analysis: Analysis | null; month: string }) {
  const months = a?.monthly_totals ?? [];
  const selected = months.find((m) => m.month === month);

  return (
    <Section title="Spending by month" aside={<Legend />} className="flex flex-col">
      {!a || months.length === 0 ? (
        <>
          <p aria-hidden="true" className="-mt-2 mb-4 text-[24px] leading-none text-t4">
            —
          </p>
          <EmptyState
            icon={ChartHistogramIcon}
            title="No spending yet"
            className="flex-1"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/insights/import?sample=1">Try with sample data</Link>
              </Button>
            }
          >
            Import a statement to see each month side by side.
          </EmptyState>
        </>
      ) : (
        <>
          <p className="-mt-2 text-[26px] leading-none font-[600] tracking-[-0.03em]">
            {selected ? <Money kobo={selected.total_kobo} className="font-sans" /> : "—"}
          </p>
          <p className="mt-1 text-[12.5px] text-t3">{formatMonth(month)}</p>

          <div className="relative mt-6 h-48">
            {/* Guide lines */}
            <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between pb-6">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="border-t border-dashed border-line" />
              ))}
            </div>
            <ul className="relative flex h-full items-end justify-around gap-3 px-2" aria-label="Spending by month">
              {months.map((m) => {
                const active = m.month === month;
                return (
                  <li key={m.month} className="flex h-full max-w-20 flex-1 flex-col items-center justify-end gap-2">
                    <Link
                      href={`/insights?month=${m.month}`}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      aria-label={`${formatMonth(m.month)}: ${fmt(m.total_kobo)}${active ? " (selected)" : ""}`}
                      title={`${formatMonth(m.month)} · ${fmt(m.total_kobo)}`}
                      className="group flex h-[calc(100%-1.5rem)] w-full items-end rounded-t-lg"
                    >
                      <span
                        className={cn(
                          "block w-full rounded-t-lg transition-colors",
                          active ? "bg-brand" : "bg-foreground/15 group-hover:bg-foreground/25",
                        )}
                        style={{ height: `${Math.max(2, m.pct_of_max)}%` }}
                      />
                    </Link>
                    <span className={cn("h-4 text-[12px]", active ? "font-medium text-foreground" : "text-t3")}>
                      {formatMonth(m.month, "short").split(" ")[0]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </Section>
  );
}
