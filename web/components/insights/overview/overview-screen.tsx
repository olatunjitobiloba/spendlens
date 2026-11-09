"use client";

import { useSearchParams } from "next/navigation";
import { Task01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { LoadingBlock } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useIsPro } from "@/providers/me-provider";
import { monthToRange } from "@/utils/dates";
import { formatMonth, formatRange } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";
import { MonthSelect } from "../shared/month-select";
import { Attention } from "./attention";
import { ComparisonCard } from "./comparison-card";
import { CutCandidates } from "./cut-candidates";
import { NoData } from "./no-data";
import { SpendSummary } from "./spend-summary";

export function OverviewScreen() {
  const params = useSearchParams();
  const isPro = useIsPro();
  const month = params.get("month");
  const range = monthToRange(month);
  const analysis = useResource(
    () => api.analysis({ ...range, compare: isPro && range ? "previous" : undefined }),
    `${month}|${isPro}`,
  );
  // Without a month in the URL the API picks the latest; ask again for the comparison.
  const latest = analysis.data?.range.start.slice(0, 7) ?? "";
  const needsCompare = isPro && !range && Boolean(latest);
  const compared = useResource(
    () => api.analysis({ ...monthToRange(latest), compare: "previous" }),
    `cmp|${latest}|${needsCompare}`,
    needsCompare,
  );

  if (analysis.error) return <ErrorNotice error={analysis.error} onRetry={analysis.reload} />;
  if (!analysis.data) return <LoadingBlock label="Loading your summary" rows={5} />;

  const a = analysis.data;
  if (a.txn_count === 0 && a.imports.length === 0) return <NoData deleted={params.get("deleted") === "1"} />;

  const current = month ?? latest;
  return (
    <>
      <PageHeader
        title={`Your spending in ${formatMonth(current)}`}
        description={`${formatRange(a.range)} · data on ${a.coverage.days_with_data} of ${a.coverage.days_in_range} days`}
        aside={<MonthSelect months={a.available_months} month={current} />}
      />
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <SpendSummary analysis={a} month={current} />
        <CutCandidates analysis={a} month={current} />
        <ComparisonCard comparison={a.comparison ?? compared.data?.comparison ?? null} />
      </div>
      <div className="mt-3">
        <Attention analysis={a} month={current} />
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-t4">
        <Icon icon={Task01Icon} className="size-3.5" />
        Select a category to see the transactions behind it.
      </p>
    </>
  );
}
