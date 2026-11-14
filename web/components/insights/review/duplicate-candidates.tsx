"use client";

import { useState } from "react";

import { BankBadge } from "@/components/ui/bank-badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { Spinner } from "@/components/ui/spinner";
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
        <dt className="text-t3">Bank</dt>
        <dd className="min-w-0">
          <BankBadge bank={t.bank} />
        </dd>
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
  const [busy, setBusy] = useState<{ id: string; decision: "same" | "different" } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  async function decide(id: string, decision: "same" | "different") {
    setBusy({ id, decision });
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
      {/*
        From sm up each card is sticky, a little lower than the one before, so
        scrolling slides the next pair over the last and they pile into a
        stack under the tabs. Offsets stop growing after a few cards so the
        stack stays shallow. On phones the cards are too tall to stack.
      */}
      <ol className="space-y-3">
        {items.map((c, i) => (
          <li
            key={c.id}
            style={{ "--stack": Math.min(i, 4) } as React.CSSProperties}
            className="rounded-2xl border border-line bg-panel p-3 sm:sticky sm:top-[calc(8rem_+_var(--stack)*0.625rem)] sm:shadow-[0_-12px_32px_-20px_rgb(0_0_0/0.35)] lg:top-[calc(4.5rem_+_var(--stack)*0.625rem)]"
          >
            <p className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-t3">
              <Status tone="warn">Possible duplicate</Status>
              {c.reason}
              <span className="ml-auto font-mono text-[11.5px] text-t4 tabular-nums">
                {i + 1} of {items.length}
              </span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <TxnSide t={c.a} label="Record A" />
              <TxnSide t={c.b} label="Record B" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Are these the same payment?">
              <Button size="sm" onClick={() => decide(c.id, "same")} disabled={busy !== null}>
                {busy?.id === c.id && busy.decision === "same" && <Spinner />}
                Same payment
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide(c.id, "different")} disabled={busy !== null}>
                {busy?.id === c.id && busy.decision === "different" && <Spinner />}
                Different payments
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
