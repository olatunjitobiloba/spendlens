"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { asApiError } from "@/hooks/use-resource";
import { api, type ApiError } from "@/lib/api";
import type { ReconciliationCandidate, Transaction } from "@/types/api";
import { formatDate } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

function TxnSide({ t, label }: { t: Transaction; label: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-line bg-panel-raised/50 p-3">
      <p className="text-[11.5px] font-medium tracking-wide text-t4 uppercase">{label}</p>
      <p className="mt-1 truncate text-[13.5px] font-medium">{t.description}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12.5px]">
        <dt className="text-t3">Date</dt>
        <dd>{formatDate(t.date)}</dd>
        <dt className="text-t3">Account</dt>
        <dd className="truncate">{t.account}</dd>
        <dt className="text-t3">Amount</dt>
        <dd>
          <Money kobo={t.amount_kobo} />
        </dd>
      </dl>
    </div>
  );
}

/** Side-by-side reconciliation (technical doc §7). */
export function DuplicateCandidates({ items, onDone }: { items: ReconciliationCandidate[]; onDone: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  async function decide(id: string, decision: "same" | "different") {
    setBusy(id);
    setError(null);
    try {
      await api.confirmReconciliation(id, decision);
      onDone();
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Section
      id="duplicates"
      title="Possible duplicates"
      description="The same payment can show up on two accounts. Tell us which ones match so they are counted once."
      aside={<Status tone="warn">{items.length} to check</Status>}
    >
      {error && <ErrorNotice error={error} className="mb-3" />}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="rounded-2xl border border-line p-3">
            <p className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-t3">
              <Status tone="warn">Possible duplicate</Status>
              {c.reason}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <TxnSide t={c.a} label="Record A" />
              <TxnSide t={c.b} label="Record B" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Are these the same payment?">
              <Button size="sm" onClick={() => decide(c.id, "same")} disabled={busy === c.id}>
                Same payment
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(c.id, "different")} disabled={busy === c.id}>
                Different payments
              </Button>
              {busy === c.id && <Spinner label="Saving" />}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
