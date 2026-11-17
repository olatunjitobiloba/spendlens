"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useProtections, withProtections } from "@/lib/plan";
import { monthToRange } from "@/utils/dates";
import { formatMonth, formatRange } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";
import { MonthSelect } from "../shared/month-select";
import { OverviewSkeleton } from "../skeletons";
import { Attention } from "./attention";
import { CategoryBreakdown } from "./category-breakdown";
import { ComparisonCard } from "./comparison-card";
import { CutCandidates } from "./cut-candidates";
import { MonthlyTrend } from "./monthly-trend";
import { StatTiles } from "./stat-tiles";

export function OverviewScreen() {
  const params = useSearchParams();
  const month = params.get("month");
  const protections = useProtections();
  const range = monthToRange(month);
  const analysis = useResource(
    () => api.analysis.get({ ...range, compare: range ? "previous" : undefined }),
    `${month}`,
  );
  // Without a month in the URL the API picks the latest; ask again for the comparison.
  const latest = analysis.data?.range.start.slice(0, 7) ?? "";
  const needsCompare = !range && Boolean(latest);
  const compared = useResource(
    () => api.analysis.get({ ...monthToRange(latest), compare: "previous" }),
    `cmp|${latest}|${needsCompare}`,
    needsCompare,
  );

  if (analysis.error) return <ErrorNotice error={analysis.error} onRetry={analysis.reload} />;
  if (!analysis.data) return <OverviewSkeleton />;

  const raw = analysis.data;
  // No imports yet: the same dashboard, every card in its empty state.
  const a = raw.imports.length === 0 && raw.txn_count === 0 ? null : withProtections(raw, protections);
  const current = month ?? latest;

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          a
            ? `${formatMonth(current)} · ${formatRange(a.range)}`
            : "Import a statement to see where your money goes. Nothing is saved until you confirm."
        }
        aside={
          a ? (
            <MonthSelect months={a.available_months} month={current} />
          ) : (
            <Button asChild>
              <Link href="/insights/import?sample=1">
                Try with sample data
                <Icon icon={ArrowRight01Icon} />
              </Link>
            </Button>
          )
        }
      />

      <div className="space-y-3">
        <StatTiles analysis={a} />
        <div className="grid gap-3 lg:grid-cols-[1.65fr_1fr]">
          <MonthlyTrend analysis={a} month={current} />
          <CutCandidates analysis={a} month={current} />
        </div>
        <div className="grid items-start gap-3 lg:grid-cols-[1.65fr_1fr]">
          <CategoryBreakdown analysis={a} month={current} />
          <div className="grid gap-3">
            <Attention analysis={a} month={current} />
            <ComparisonCard comparison={a ? (a.comparison ?? compared.data?.comparison ?? null) : null} />
          </div>
        </div>
      </div>
    </>
  );
}
