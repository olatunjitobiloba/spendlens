import Link from "next/link";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Bar } from "@/components/ui/bar";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { UNCATEGORISED } from "@/configs/categories";
import type { Analysis } from "@/types/api";
import { reviewHref } from "@/utils/links";

/** Headline total and spend by category. Each category links to its transactions. */
export function SpendSummary({ analysis, month }: { analysis: Analysis; month: string }) {
  const a = analysis;
  return (
    <Section className="lg:row-span-2">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[13px] font-medium text-t3">Spent</p>
          <p className="mt-1 text-[32px] leading-none font-[600] tracking-[-0.04em] sm:text-[38px]">
            <Money kobo={a.total_spent_kobo} className="font-sans" />
          </p>
        </div>
        <dl className="flex gap-6 text-[13px]">
          <div>
            <dt className="text-t3">Money in</dt>
            <dd>
              <Money kobo={a.total_income_kobo} />
            </dd>
          </div>
          <div>
            <dt className="text-t3">Transactions</dt>
            <dd className="font-mono tabular-nums">{a.txn_count}</dd>
          </div>
        </dl>
      </div>

      <h2 className="sr-only">Spending by category</h2>
      {a.categories.length === 0 ? (
        <p className="mt-6 text-[13.5px] text-t3">No spending in this month.</p>
      ) : (
        <ul className="mt-6 space-y-3.5">
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
                <span className="ml-2 hidden font-mono text-t4 sm:inline">{c.share_pct}%</span>
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
