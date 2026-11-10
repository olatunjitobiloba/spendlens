"use client";

import { useRef, useState } from "react";
import { Calculator01Icon, Cancel01Icon, ImageDownloadIcon } from "@hugeicons/core-free-icons";

import { LogoMark } from "@/components/brand/logo";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EvidenceLink } from "@/components/ui/evidence-link";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Status } from "@/components/ui/status";
import type { ApiError } from "@/lib/api";
import type { Scenario } from "@/types/api";
import { formatDate, formatMonth, formatRange } from "@/utils/format";
import { reviewHref } from "@/utils/links";
import { ErrorNotice } from "../shared/error-notice";
import { ExplanationPanel } from "./explanation-panel";
import { SaveScenario } from "./save-scenario";

/** Elements marked with this are left out of the downloaded image (links, buttons). */
const SKIP_EXPORT = { "data-export": "skip" } as const;

function Totals({ scenario }: { scenario: Scenario }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-panel-raised/60 p-3">
        <dt className="text-[12.5px] text-t3">Spent (baseline)</dt>
        <dd className="mt-1 text-[18px] font-[600]">
          <Money kobo={scenario.baseline_kobo} />
        </dd>
      </div>
      <div className="rounded-xl bg-brand/[0.08] p-3">
        <dt className="text-[12.5px] text-t3">You could cut</dt>
        <dd className="mt-1 text-[18px] font-[600] text-brand">
          <Money kobo={scenario.total_reduction_kobo} sign="minus" />
        </dd>
      </div>
      <div className="rounded-xl bg-foreground p-3 text-background">
        <dt className="text-[12.5px] opacity-75">Spending would be</dt>
        <dd className="mt-1 text-[18px] font-[600]">
          <Money kobo={scenario.remaining_kobo} />
        </dd>
      </div>
    </dl>
  );
}

function Breakdown({ scenario, month }: { scenario: Scenario; month: string }) {
  const cut = scenario.categories.filter((c) => c.percent > 0);
  if (!cut.length) return <p className="mt-4 text-[13.5px] text-t3">No cuts chosen, so spending stays the same.</p>;
  return (
    <div className="mt-4 overflow-x-auto" tabIndex={0} aria-label="Cut by category">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead className="text-t3">
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-medium">Category</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Spent</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Cut</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Saves</th>
            <th scope="col" className="py-2 font-medium" {...SKIP_EXPORT}>
              <span className="sr-only">Evidence</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {cut.map((c) => (
            <tr key={c.category}>
              <td className="py-2 pr-3">{c.category}</td>
              <td className="py-2 pr-3 text-right">
                <Money kobo={c.total_kobo} />
              </td>
              <td className="py-2 pr-3 text-right font-mono">{c.percent}%</td>
              <td className="py-2 pr-3 text-right">
                <Money kobo={c.reduction_kobo} sign="minus" />
              </td>
              <td className="py-2 text-right" {...SKIP_EXPORT}>
                <EvidenceLink href={reviewHref({ category: c.category, month })}>Transactions</EvidenceLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The part of the result that goes into the image: brand line, figures, breakdown, explanation. */
function ResultSheet({ scenario, month }: { scenario: Scenario; month: string }) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <AlertDialogTitle className="text-[17px] font-[650] tracking-[-0.02em]">
              Scenario for {formatMonth(month)}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-t3">
              {formatRange(scenario.range)} · calculated by SpendLens on {formatDate(scenario.created_at)}
            </AlertDialogDescription>
          </div>
        </div>
        <Status tone="neutral">Scenario, not realised savings</Status>
      </div>

      <div className="mt-5">
        <Totals scenario={scenario} />
        <Breakdown scenario={scenario} month={month} />
      </div>

      {scenario.coverage_warnings.map((w) => (
        <Notice key={w} tone="warn" className="mt-3" title="Based on incomplete data">
          {w}
        </Notice>
      ))}

      {scenario.evidence_txn_ids.length > 0 && (
        <p className="mt-3 text-[12.5px] text-t3">
          Based on {scenario.evidence_txn_ids.length} transactions.{" "}
          <span {...SKIP_EXPORT}>
            <EvidenceLink href={reviewHref({ ids: scenario.evidence_txn_ids.join(",") })}>See all of them</EvidenceLink>
          </span>
        </p>
      )}

      <div className="mt-4">
        <ExplanationPanel scenarioId={scenario.id} />
      </div>
    </>
  );
}

/** Shown while the scenario is calculated: a moving bar and the result's shape. */
function ResultLoading() {
  return (
    <div role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex size-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-brand/30 motion-reduce:animate-none" />
          <Icon icon={Calculator01Icon} className="relative size-5" />
        </span>
        <div>
          <AlertDialogTitle className="text-[16px] font-[650]">Calculating your scenario</AlertDialogTitle>
          <AlertDialogDescription className="text-[12.5px] text-t3">
            Applying your cuts to this month&apos;s spending. Protected categories stay untouched.
          </AlertDialogDescription>
        </div>
      </div>
      <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-brand/10">
        <span className="absolute inset-y-0 w-1/3 animate-[scenario-progress_1.1s_ease-in-out_infinite] rounded-full bg-brand motion-reduce:animate-none" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-panel-raised/60 p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-5 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-4 divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2.5">
            <Skeleton className="h-3.5" style={{ width: `${30 + ((i * 9) % 20)}%` }} />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-4 h-24 rounded-2xl" />
    </div>
  );
}

async function downloadJpg(node: HTMLElement, filename: string) {
  const { toJpeg } = await import("html-to-image");
  const bg = getComputedStyle(node).backgroundColor;
  const url = await toJpeg(node, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: bg,
    filter: (n) => !(n instanceof HTMLElement && n.dataset.export === "skip"),
  });
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * The scenario result as a dialog. Opens as soon as Calculate is pressed and
 * shows a loading state until the API answers. The figures can be saved as JPG.
 */
export function ScenarioResultDialog({
  open,
  onOpenChange,
  scenario,
  busy,
  error,
  onRetry,
  month,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: Scenario | null;
  busy: boolean;
  error: ApiError | null;
  onRetry: () => void;
  month: string;
  onSaved: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const ready = Boolean(scenario) && !busy && !error;

  async function exportImage() {
    if (!sheetRef.current || !scenario) return;
    setExporting(true);
    setExportFailed(false);
    try {
      await downloadJpg(sheetRef.current, `spendlens-scenario-${month}.jpg`);
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex max-h-[92dvh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[1.5rem] border border-line-strong bg-panel p-0 ring-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="p-5 sm:p-6">
              <AlertDialogTitle className="mb-3 text-[16px] font-[650]">The scenario could not be calculated</AlertDialogTitle>
              <AlertDialogDescription className="sr-only">An error occurred.</AlertDialogDescription>
              <ErrorNotice error={error} onRetry={onRetry} />
            </div>
          ) : busy || !scenario ? (
            <div className="p-5 sm:p-6">
              <ResultLoading />
            </div>
          ) : (
            // Keyed by scenario so the explanation and save form start fresh for each result.
            <div key={scenario.id}>
              <div ref={sheetRef} className="bg-panel p-5 sm:p-6">
                <ResultSheet scenario={scenario} month={month} />
              </div>
              <div className="px-5 pb-5 sm:px-6">
                <SaveScenario scenario={scenario} onSaved={onSaved} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-panel-raised/50 px-5 py-3.5 sm:px-6">
          <span className="text-[12px] text-t3" aria-live="polite">
            {exportFailed ? (
              <span className="text-destructive">The image could not be made. Try again.</span>
            ) : (
              ready && "Download the figures to share them."
            )}
          </span>
          <div className="flex gap-2">
            <AlertDialogCancel size="default">
              <Icon icon={Cancel01Icon} />
              Close
            </AlertDialogCancel>
            <Button onClick={exportImage} disabled={!ready || exporting}>
              {exporting ? <Spinner /> : <Icon icon={ImageDownloadIcon} />}
              {exporting ? "Preparing…" : "Download JPG"}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
