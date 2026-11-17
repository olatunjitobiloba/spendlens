"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Alert02Icon, Calculator01Icon, Cancel01Icon, ImageDownloadIcon } from "@hugeicons/core-free-icons";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Status } from "@/components/ui/status";
import { showToast } from "@/components/ui/toast";
import type { Scenario } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatDate, formatMonth, formatRange } from "@/utils/format";
import { reviewHref } from "@/utils/links";
import { ExplanationPanel } from "./explanation-panel";
import { SaveScenario } from "./save-scenario";

/** Elements marked with this are left out of the downloaded image (links, buttons). */
const SKIP_EXPORT = { "data-export": "skip" } as const;

const pctOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** One comparison row: label, a bar scaled to the baseline, and the amount. */
function CompareRow({ label, kobo, width, cut }: { label: string; kobo: number; width: number; cut?: number }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-[12.5px]">
      <span className="text-t3">{label}</span>
      <span aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
        <span
          className={cn("h-full rounded-full", cut === undefined ? "bg-foreground/25" : "bg-brand")}
          style={{ width: `${width}%` }}
        />
        {cut !== undefined && cut > 0 && (
          <span
            className="h-full bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--brand)_35%,transparent)_0_3px,transparent_3px_6px)]"
            style={{ width: `${cut}%` }}
          />
        )}
      </span>
      <Money kobo={kobo} className="text-right font-sans font-medium text-t2" />
    </div>
  );
}

/** The headline saving, and before/after bars that show it at a glance. */
function Totals({ scenario: s }: { scenario: Scenario }) {
  const share = pctOf(s.total_reduction_kobo, s.baseline_kobo);
  const after = s.baseline_kobo > 0 ? (s.remaining_kobo / s.baseline_kobo) * 100 : 0;
  return (
    <div className="rounded-2xl border border-line bg-panel-raised/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-[12.5px] text-t3">You could keep</p>
          <p className="mt-1.5 text-[28px] leading-none font-[650] tracking-[-0.03em] text-brand tabular-nums sm:text-[32px]">
            <Money kobo={s.total_reduction_kobo} className="font-sans" />
          </p>
        </div>
        <Status tone="brand" className="mb-0.5">
          {share}% less than you spent
        </Status>
      </div>
      <div className="mt-5 space-y-2.5">
        <CompareRow label="Spent" kobo={s.baseline_kobo} width={100} />
        <CompareRow label="After the cut" kobo={s.remaining_kobo} width={after} cut={100 - after} />
      </div>
    </div>
  );
}

/** Each cut category: what it saves, and a bar of kept vs. cut, scaled to the largest category. */
function Breakdown({ scenario, month }: { scenario: Scenario; month: string }) {
  const cut = scenario.categories.filter((c) => c.percent > 0).sort((a, b) => b.reduction_kobo - a.reduction_kobo);
  if (!cut.length) return <p className="mt-5 text-center text-[13.5px] text-t3">No cuts chosen, so spending stays the same.</p>;
  const largest = Math.max(...cut.map((c) => c.total_kobo));
  return (
    <section aria-labelledby="breakdown-title" className="mt-6">
      <h3 id="breakdown-title" className="mb-3 text-[13px] font-[600]">
        Where it comes from
      </h3>
      <ul className="space-y-3.5">
        {cut.map((c) => {
          const kept = ((c.total_kobo - c.reduction_kobo) / largest) * 100;
          const saved = (c.reduction_kobo / largest) * 100;
          return (
            <li key={c.category} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
              <span className="flex min-w-0 items-center gap-2 text-[13.5px]">
                <Link
                  href={reviewHref({ category: c.category, month })}
                  className="truncate text-t2 underline-offset-4 hover:text-foreground hover:underline"
                >
                  {c.category}
                </Link>
                <span className="shrink-0 font-mono text-[11.5px] text-t4">−{c.percent}%</span>
              </span>
              <span className="text-right text-[13px]">
                <Money kobo={c.reduction_kobo} sign="minus" className="font-sans font-[600] text-brand" />
                <span className="ml-1.5 hidden text-[12px] text-t4 sm:inline">
                  of <Money kobo={c.total_kobo} className="font-sans" />
                </span>
              </span>
              <span aria-hidden="true" className="col-span-2 flex h-1.5 overflow-hidden rounded-full bg-foreground/[0.05]">
                <span className="h-full bg-foreground/20" style={{ width: `${kept}%` }} />
                <span className="h-full rounded-r-full bg-brand" style={{ width: `${saved}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex items-center gap-4 text-[11.5px] text-t4" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-foreground/20" /> Still spent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" /> Cut
        </span>
      </p>
    </section>
  );
}

/** The part of the result that goes into the image: brand line, figures, breakdown, explanation. */
function ResultSheet({ scenario, month }: { scenario: Scenario; month: string }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <LogoMark size={36} />
        <div className="min-w-0">
          <AlertDialogTitle className="text-[17px] font-[650] tracking-[-0.02em]">
            Scenario for {formatMonth(month)}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[12.5px] text-t3">
            {formatRange(scenario.range)} · calculated {formatDate(scenario.created_at)}
          </AlertDialogDescription>
        </div>
      </div>

      <div className="mt-5">
        <Totals scenario={scenario} />
        <Breakdown scenario={scenario} month={month} />
      </div>

      <div className="mt-6">
        <ExplanationPanel scenario={scenario} />
      </div>

      {scenario.coverage_warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {scenario.coverage_warnings.map((w) => (
            <li key={w} className="flex gap-2 text-[12.5px] leading-relaxed text-t3">
              <Icon icon={Alert02Icon} className="mt-0.5 size-3.5 shrink-0 text-warn" />
              <span>
                <span className="font-medium text-t2">Incomplete data.</span> {w}
              </span>
            </li>
          ))}
        </ul>
      )}

      {scenario.evidence_txn_ids.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12px] text-t4">
          <span>Based on {scenario.evidence_txn_ids.length} transactions · made with SpendLens</span>
          <span {...SKIP_EXPORT}>
            <EvidenceLink href={reviewHref({ ids: scenario.evidence_txn_ids.join(",") })}>See them all</EvidenceLink>
          </span>
        </p>
      )}
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
      <div className="mt-5 rounded-2xl border border-line bg-panel-raised/40 p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2.5 h-8 w-44" />
        <Skeleton className="mt-5 h-2 w-full" />
        <Skeleton className="mt-3 h-2 w-4/5" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <Skeleton className="h-3.5" style={{ width: `${30 + ((i * 9) % 20)}%` }} />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="mt-2 h-1.5 w-full" />
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
 * shows a short loading state while the numbers are worked out. The figures can be saved as JPG.
 */
export function ScenarioResultDialog({
  open,
  onOpenChange,
  scenario,
  busy,
  month,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: Scenario | null;
  busy: boolean;
  month: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const ready = Boolean(scenario) && !busy;

  async function exportImage() {
    if (!sheetRef.current || !scenario) return;
    setExporting(true);
    try {
      await downloadJpg(sheetRef.current, `spendlens-scenario-${month}.jpg`);
    } catch {
      showToast({
        tone: "danger",
        title: "Couldn't make the image",
        description: "Try again in a moment.",
        actions: [{ label: "Retry", onClick: () => void exportImage() }],
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex max-h-[92dvh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[1.5rem] border border-line-strong bg-panel p-0 ring-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {busy || !scenario ? (
            <div className="p-5 sm:p-6">
              <ResultLoading />
            </div>
          ) : (
            // Keyed by scenario so the explanation and save form start fresh for each result.
            <div ref={sheetRef} key={scenario.id} className="bg-panel p-5 sm:p-6">
              <ResultSheet scenario={scenario} month={month} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-panel-raised/50 px-5 py-3.5 sm:px-6">
          {ready && scenario ? <SaveScenario key={scenario.id} scenario={scenario} /> : <span />}
          <div className="flex gap-2">
            <AlertDialogCancel size="default">
              <Icon icon={Cancel01Icon} />
              Close
            </AlertDialogCancel>
            <Button onClick={exportImage} disabled={!ready || exporting}>
              {exporting ? <Spinner /> : <Icon icon={ImageDownloadIcon} />}
              {exporting ? "Preparing…" : "Save as image"}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
