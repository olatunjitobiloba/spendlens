"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Invoice01Icon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { SubscriptionItem } from "@/types/api";
import { fmt } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

function SubscriptionCard({ sub }: { sub: SubscriptionItem }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sub.cancellation_email_template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-[1.25rem] border border-line bg-panel p-5 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-[600] tracking-[-0.01em]">{sub.merchant}</h3>
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-t2">
              Every {sub.frequency_days} days
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[22px] font-[650] tracking-tight">{fmt(sub.monthly_kobo)}</span>
            <span className="text-[13px] text-t3">/ month</span>
            <span className="text-[12px] text-t4">({fmt(sub.annual_kobo)}/yr)</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {sub.cancellation_url && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="active:scale-[0.98] transition-transform"
            >
              <a
                href={sub.cancellation_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5"
              >
                Cancel via Portal
                <Icon icon={LinkSquare02Icon} className="size-3.5" />
              </a>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="active:scale-[0.98] transition-transform"
          >
            <Icon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} className="size-3.5" />
            {copied ? "Copied notice" : "Copy email notice"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide template" : "Preview template"}
          </Button>
        </div>
      </div>

      {/* Expandable Email Template */}
      {expanded && (
        <div className="mt-4 rounded-xl border border-line/60 bg-foreground/[0.02] p-4 text-[12.5px] font-mono leading-relaxed text-foreground whitespace-pre-wrap">
          {sub.cancellation_email_template}
        </div>
      )}
    </div>
  );
}

export function SubscriptionsScreen() {
  const subs = useResource(() => api.subscriptions(), "subscriptions-list");

  if (subs.error) {
    return <ErrorNotice error={subs.error} onRetry={subs.reload} />;
  }

  if (!subs.data) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-foreground/5" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-foreground/5" />
          <div className="h-28 rounded-2xl bg-foreground/5" />
          <div className="h-28 rounded-2xl bg-foreground/5" />
        </div>
        <div className="h-48 rounded-2xl bg-foreground/5" />
      </div>
    );
  }

  const items = subs.data;
  const totalMonthlyKobo = items.reduce((acc, item) => acc + item.monthly_kobo, 0);
  const totalAnnualKobo = items.reduce((acc, item) => acc + item.annual_kobo, 0);

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          title="Subscriptions"
          description="Identify repeating software, media, and membership charges to safely cancel unused commitments."
        />
        <EmptyState
          icon={Invoice01Icon}
          title="No recurring subscriptions detected"
          action={
            <Button asChild variant="default">
              <Link href="/insights/import">
                Import transactions
                <Icon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </Button>
          }
        >
          Import your statements to automatically detect recurring services like Netflix, Spotify, DSTV, or software charges.
        </EmptyState>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions & Cancellations"
        description="Agentic recurring service detection. Equipped with verified cancellation portals and pre-drafted legal cancellation notices."
        aside={
          <Button asChild variant="outline" size="sm">
            <Link href="/insights/chat">
              Ask AI about subscriptions
              <Icon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {/* Aggregate Drain Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-line bg-panel p-5">
          <span className="text-[12px] font-medium uppercase tracking-wider text-t3">Active Subscriptions</span>
          <p className="mt-3 text-[26px] font-[650] tracking-tight">{items.length}</p>
          <p className="mt-1 text-[13px] text-t3">Recurring merchants detected</p>
        </div>

        <div className="rounded-[1.25rem] border border-line bg-panel p-5">
          <span className="text-[12px] font-medium uppercase tracking-wider text-t3">Monthly Commitment</span>
          <p className="mt-3 text-[26px] font-[650] tracking-tight">{fmt(totalMonthlyKobo)}</p>
          <p className="mt-1 text-[13px] text-t3">Drawn automatically every month</p>
        </div>

        <div className="rounded-[1.25rem] border border-line bg-panel p-5">
          <span className="text-[12px] font-medium uppercase tracking-wider text-t3">Annualized Burn</span>
          <p className="mt-3 text-[26px] font-[650] tracking-tight">{fmt(totalAnnualKobo)}</p>
          <p className="mt-1 text-[13px] text-t3">Projected yearly expenditure</p>
        </div>
      </div>

      {/* Subscription Cards List */}
      <Section
        title="Detected Recurring Services"
        description="Select any subscription to open its official cancellation portal or copy a ready-to-send formal notice."
      >
        <div className="space-y-4">
          {items.map((sub, i) => (
            <SubscriptionCard key={i} sub={sub} />
          ))}
        </div>
      </Section>

      {/* Safety & Consent Guardrail */}
      <Notice tone="positive" title="Strict Consent Architecture">
        SpendLens provides the verified links and prepared drafts; we never cancel your subscriptions without your direct action and consent.
      </Notice>
    </div>
  );
}
