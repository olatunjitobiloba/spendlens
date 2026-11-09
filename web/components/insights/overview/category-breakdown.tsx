import Link from "next/link";
import { PieChartIcon, SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Bar } from "@/components/ui/bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HeaderLink } from "@/components/ui/header-link";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { UNCATEGORISED } from "@/configs/categories";
import type { Analysis } from "@/types/api";
import { reviewHref } from "@/utils/links";

/** Spend by category. Each row links to the transactions behind it (PRD R2). */
export function CategoryBreakdown({ analysis: a, month }: { analysis: Analysis | null; month: string }) {
  return (
    <Section
      title="Spending by category"
      description="Largest first, protected ones in grey"
      aside={a && <HeaderLink href={reviewHref({ month })}>All transactions</HeaderLink>}
      className="flex flex-col"
    >
      {!a || a.categories.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title={a ? "No spending this month" : "No transactions yet"}
          className="flex-1"
          action={
            !a && (
              <Button asChild variant="outline" size="sm">
                <Link href="/insights/import">Import a CSV</Link>
              </Button>
            )
          }
        >
          {a ? "Pick another month to see its categories." : "Import a CSV, or try the sample data."}
        </EmptyState>
      ) : (
        <ul className="space-y-3.5">
          {a.categories.map((c) => (
            <li key={c.category} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
                <Link
                  href={reviewHref({ category: c.category, month })}
                  className="truncate rounded text-t2 underline-offset-4 hover:text-foreground hover:underline"
                >
                  {c.category}
                </Link>
                {c.protected && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] text-t3">
                    <Icon icon={SquareLock02Icon} className="size-3.5" />
                    Protected
                  </span>
                )}
                {c.category === UNCATEGORISED && <Status tone="warn">Needs review</Status>}
              </span>
              <span className="text-right text-[12.5px] text-t2">
                <Money kobo={c.total_kobo} />
                <span className="ml-2 hidden w-12 font-mono text-t4 sm:inline-block">{c.share_pct}%</span>
              </span>
              <span className="col-span-2">
                <Bar pct={c.share_pct} muted={c.protected} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
