"use client";

import Link from "next/link";
import {
  Alert02Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Moon02Icon,
  SparklesIcon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { fmt, fmtWhole } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

export function HabitsScreen() {
  const habits = useResource(() => api.habits(), "habits-audit");

  if (habits.error) {
    return <ErrorNotice error={habits.error} onRetry={habits.reload} />;
  }

  if (!habits.data) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-foreground/5" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-32 rounded-2xl bg-foreground/5" />
          <div className="h-32 rounded-2xl bg-foreground/5" />
          <div className="h-32 rounded-2xl bg-foreground/5" />
        </div>
        <div className="h-64 rounded-2xl bg-foreground/5" />
      </div>
    );
  }

  const d = habits.data;

  if (d.total_analyzed_txns === 0) {
    return (
      <>
        <PageHeader
          title="Habits & Emotional Spend"
          description="Auditing timestamps, late-night impulse purchases, and recurring debit patterns."
        />
        <EmptyState
          icon={Clock01Icon}
          title="No debit transactions to analyze"
          action={
            <Button asChild variant="default">
              <Link href="/insights/import">
                Import transactions
                <Icon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </Button>
          }
        >
          Import your bank statement to see timing analysis, weekend spending surges, and micro-drain audits.
        </EmptyState>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits & Emotional Spend"
        description="Audit how timing, emotion, and low-friction friction triggers drive your spending. Powered purely by deterministic timestamp analysis."
        aside={
          <Button asChild variant="outline" size="sm">
            <Link href="/insights/chat">
              Chat about habits
              <Icon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {/* Overview Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Late-Night Spending */}
        <div className="rounded-[1.25rem] border border-line bg-panel p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-t3">Late-Night Debits</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-500">
              <Icon icon={Moon02Icon} className="size-3" />
              10 PM – 4:30 AM
            </span>
          </div>
          <p className="mt-3 text-[26px] font-[650] tracking-tight">{fmt(d.late_night_kobo)}</p>
          <p className="mt-1 text-[13px] text-t3">
            {d.late_night_count} transaction{d.late_night_count === 1 ? "" : "s"} in the nocturnal impulse window
          </p>
        </div>

        {/* Weekend Spending Surge */}
        <div className="rounded-[1.25rem] border border-line bg-panel p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-t3">Weekend Surge</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
              <Icon icon={Sun03Icon} className="size-3" />
              Sat & Sun
            </span>
          </div>
          <p className="mt-3 text-[26px] font-[650] tracking-tight">{d.weekend_surge_percentage.toFixed(1)}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, d.weekend_surge_percentage))}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-t3">
            {fmtWhole(d.weekend_kobo)} spent on weekends ({d.weekend_count} debits)
          </p>
        </div>

        {/* Micro-Drains */}
        <div className="rounded-[1.25rem] border border-line bg-panel p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-t3">Micro-Drains</span>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-500">
              &lt; ₦1,500
            </span>
          </div>
          <p className="mt-3 text-[26px] font-[650] tracking-tight">{fmt(d.micro_drain_kobo)}</p>
          <p className="mt-1 text-[13px] text-t3">
            {d.micro_drain_count} low-friction debits quietly depleting reserves
          </p>
        </div>
      </div>

      {/* Main Analysis Bento Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Identified Triggers & Alerts */}
        <Section
          title="Habit Triggers & Vulnerabilities"
          description="Spending patterns identified by analyzing transaction frequency and hour of day."
        >
          {d.warnings.length === 0 ? (
            <p className="text-[14px] text-t3">No elevated habit triggers detected in the current statement.</p>
          ) : (
            <div className="space-y-3">
              {d.warnings.map((warn, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-line/60 bg-foreground/[0.02] p-3.5"
                >
                  <Icon icon={Alert02Icon} className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <p className="text-[13.5px] leading-relaxed text-foreground">{warn}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Actionable Remedies */}
        <Section
          title="Actionable Interventions"
          description="Concrete, practical behavioral guardrails to immediately curb leakage."
        >
          {d.actionable_cuts.length === 0 ? (
            <p className="text-[14px] text-t3">No recommendations needed at this time.</p>
          ) : (
            <div className="space-y-3">
              {d.actionable_cuts.map((cut, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5"
                >
                  <Icon icon={SparklesIcon} className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <p className="text-[13.5px] leading-relaxed text-foreground">{cut}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Educational Notice */}
      <Notice tone="neutral" title="Zero Third-Party Tracking">
        SpendLens audits habits deterministically on your device and private backend. We do not sell your transactional data, and no third-party tracking scripts monitor your activity.
      </Notice>
    </div>
  );
}
