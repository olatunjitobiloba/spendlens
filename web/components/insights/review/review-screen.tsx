"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LoadingBlock, Spinner } from "@/components/ui/loading";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { Transaction } from "@/types/api";
import { monthToRange } from "@/utils/dates";
import { ErrorNotice } from "../shared/error-notice";
import { DuplicateCandidates } from "./duplicate-candidates";
import { ReviewStats } from "./review-stats";
import { TransactionFilters, type ReviewFilter } from "./transaction-filters";
import { TransactionsTable } from "./transactions-table";

const PAGE_SIZE = 20;

export function ReviewScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const filter: ReviewFilter = params.get("filter") === "needs_review" ? "needs_review" : "all";
  const category = params.get("category") ?? "";
  const month = params.get("month") ?? "";
  const ids = params.get("ids") ?? "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const analysis = useResource(() => api.analysis(), "review-analysis");
  const txns = useResource(
    () =>
      api.transactions({
        page,
        page_size: PAGE_SIZE,
        review_state: filter === "needs_review" ? "needs_review" : undefined,
        category: category || undefined,
        q: q || undefined,
        ids: ids ? ids.split(",") : undefined,
        ...monthToRange(month),
      }),
    params.toString(),
  );

  function setParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  function onSaved(t: Transaction) {
    if (txns.data) txns.setData({ ...txns.data, items: txns.data.items.map((x) => (x.id === t.id ? t : x)) });
    void analysis.reload();
  }

  const a = analysis.data;
  if (analysis.error) return <ErrorNotice error={analysis.error} onRetry={analysis.reload} />;
  if (!a) return <LoadingBlock label="Loading your transactions" rows={6} />;
  if (a.imports.length === 0) {
    return (
      <>
        <PageHeader title="Review" />
        <EmptyState
          title="Nothing to review yet"
          action={
            <Button asChild>
              <Link href="/insights/import">Import transactions</Link>
            </Button>
          }
        >
          Import a CSV or the sample data first.
        </EmptyState>
      </>
    );
  }

  const hasFilters = Boolean(category || month || ids || q || filter !== "all");
  const totalPages = txns.data ? Math.max(1, Math.ceil(txns.data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Review what SpendLens found"
        description="Correct anything that looks wrong. Totals and scenarios update from your answers."
      />
      <ReviewStats analysis={a} />

      {a.coverage_warnings
        .filter((w) => !w.includes("possible duplicate"))
        .map((w) => (
          <Notice key={w} tone="warn" title="Gap in your data" className="mb-3">
            {w} Totals for that stretch will be lower than real life.
          </Notice>
        ))}

      {a.reconciliation_candidates.length > 0 && (
        <div className="mb-3">
          <DuplicateCandidates
            items={a.reconciliation_candidates}
            onDone={() => {
              void analysis.reload();
              void txns.reload();
            }}
          />
        </div>
      )}

      <Section title="Transactions">
        <TransactionFilters
          key={q}
          filter={filter}
          category={category}
          month={month}
          q={q}
          months={a.available_months}
          needsReviewCount={a.needs_review_count}
          onChange={setParams}
        />

        {hasFilters && (
          <p className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-t3">
            {ids && <Status tone="brand">Showing {ids.split(",").length} supporting transactions</Status>}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => router.replace("?", { scroll: false })}
            >
              Clear filters
            </button>
          </p>
        )}

        {txns.error ? (
          <ErrorNotice error={txns.error} onRetry={txns.reload} />
        ) : !txns.data ? (
          <Spinner label="Loading transactions" />
        ) : txns.data.items.length === 0 ? (
          <p className="flex items-center gap-2 py-6 text-[13.5px] text-t3">
            <Icon icon={CheckmarkCircle02Icon} className="text-positive" />
            {filter === "needs_review"
              ? "Nothing needs review. Every transaction has a category."
              : "No transactions match these filters."}
          </p>
        ) : (
          <>
            <TransactionsTable items={txns.data.items} dimmed={txns.loading} onSaved={onSaved} />
            <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px] text-t3">
              <span>
                {txns.data.total} transaction{txns.data.total === 1 ? "" : "s"} · page {page} of {totalPages}
              </span>
              <span className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setParams({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </span>
            </nav>
          </>
        )}
      </Section>
    </>
  );
}
