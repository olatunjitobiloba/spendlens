"use client";

import { EvidenceLink } from "@/components/ui/evidence-link";
import { Spinner } from "@/components/ui/loading";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { formatDate } from "@/utils/format";
import { reviewHref } from "@/utils/links";
import { ErrorNotice } from "../shared/error-notice";

const every = (days: number) => (days === 7 ? "Every week" : days === 14 ? "Every 2 weeks" : "Every month");
// Confidence in words, not a bare number or colour (PRD R3).
const likelihood = (c: number) => (c >= 0.8 ? "Likely recurring" : "Possibly recurring");

/** Recurring-payment candidates. Nothing is cancelled automatically. */
export function RecurringList() {
  const recurring = useResource(() => api.recurring(), "recurring");

  return (
    <Section
      title="Recurring payments"
      description="Payments that repeat at a steady interval. SpendLens never cancels anything for you."
    >
      {recurring.error ? (
        <ErrorNotice error={recurring.error} onRetry={recurring.reload} />
      ) : !recurring.data ? (
        <Spinner label="Looking for repeat payments" />
      ) : recurring.data.length === 0 ? (
        <p className="text-[13.5px] text-t3">
          No repeat payments found yet. It takes at least three payments at a steady interval.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {recurring.data.map((r) => (
            <li key={`${r.merchant_key}-${r.amount_kobo}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium capitalize">{r.merchant_key}</span>
                <span className="text-[12.5px] text-t3">
                  {every(r.period_days)} · seen {r.occurrences} times · next around {formatDate(r.next_due)}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-3">
                <Status tone={r.confidence >= 0.8 ? "positive" : "neutral"}>{likelihood(r.confidence)}</Status>
                <Money kobo={r.amount_kobo} className="text-[13px]" />
                <EvidenceLink href={reviewHref({ ids: r.txn_ids.join(",") })}>Payments</EvidenceLink>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
