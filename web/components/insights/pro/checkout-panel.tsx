"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { KORA_PUBLIC_KEY } from "@/configs/env";
import { useFixtureMode } from "@/hooks/use-fixture-mode";
import { useOrderPolling } from "@/hooks/use-order-polling";
import { asApiError } from "@/hooks/use-resource";
import { api, newIdempotencyKey, type ApiError } from "@/lib/api";
import { openKoraCheckout } from "@/lib/kora";
import type { SandboxOutcome } from "@/lib/mock/server";
import type { Me, Order } from "@/types/api";
import { ErrorNotice } from "../shared/error-notice";
import { PaymentStatus } from "./payment-status";
import { ProFeatures } from "./pro-features";
import { SandboxSimulator } from "./sandbox-simulator";

// Synthetic customer for sample mode only.
const SAMPLE_CUSTOMER = { name: "Tolu Adebayo", email: "tolu.sample@example.com" };

export function CheckoutPanel({ me, onPaid }: { me: Me; onPaid: () => void }) {
  const fixtures = useFixtureMode() ?? false;
  // Sample mode settles faster so the "no confirmation" state is quick to show.
  const polling = useOrderPolling({ timeoutMs: fixtures ? 20_000 : 120_000 });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [closedByUser, setClosedByUser] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  // One key per payment attempt; a retry of the same attempt reuses it.
  const keyRef = useRef<string | null>(null);

  const { state } = polling;
  const settledStatus = state.phase === "settled" ? state.order.status : null;
  useEffect(() => {
    if (settledStatus === "paid" || settledStatus === "overpaid") onPaid();
  }, [settledStatus, onPaid]);

  async function pay(e?: React.FormEvent) {
    e?.preventDefault();
    keyRef.current ??= newIdempotencyKey();
    setBusy(true);
    setError(null);
    setClosedByUser(false);
    try {
      const created = await api.createOrder(keyRef.current);
      setOrder(created);
      if (fixtures) {
        setShowSimulator(true);
        return;
      }
      if (!KORA_PUBLIC_KEY) throw new Error("Kora Checkout is not configured on this deployment. Use sample mode to try payment.");
      await openKoraCheckout(
        KORA_PUBLIC_KEY,
        created,
        { name: name.trim(), email: email.trim() },
        {
          // Hints for when to check. They never unlock anything.
          onSuccess: () => polling.start(created),
          onFailed: () => polling.start(created),
          onClose: () => {
            setClosedByUser(true);
            polling.start(created);
          },
        },
      );
      polling.start(created);
    } catch (err) {
      setError(err instanceof Error && !("kind" in err) ? err : asApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function simulate(outcome: SandboxOutcome | "close") {
    if (!order) return;
    setShowSimulator(false);
    if (outcome === "close") setClosedByUser(true);
    else {
      const { simulateWebhook } = await import("@/lib/mock/server");
      simulateWebhook(order.id, outcome);
    }
    polling.start(order);
  }

  function retry() {
    keyRef.current = null; // a new attempt is a new order
    setOrder(null);
    setShowSimulator(false);
    setClosedByUser(false);
    polling.reset();
  }

  const inFlight = state.phase === "polling" || showSimulator;

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[1.2fr_1fr]">
      <Section title="SpendLens Pro" description={`${me.pro_days} days of extra tools. No auto-renewal.`}>
        <p className="text-[34px] leading-none font-[600] tracking-[-0.04em]">
          <Money kobo={me.pro_price_kobo} className="font-sans" />
        </p>
        <p className="mt-1 text-[12.5px] text-t3">One payment for {me.pro_days} days. Test price in this demo.</p>
        <div className="mt-5">
          <ProFeatures />
        </div>
      </Section>

      <Section title="Pay with Kora" description="Card, bank transfer and other methods Kora supports.">
        {!order || state.phase === "idle" ? (
          <form onSubmit={pay} className="space-y-3">
            {fixtures ? (
              <Notice title="Sample mode">
                Paying as the synthetic customer {SAMPLE_CUSTOMER.name}. No real money moves.
              </Notice>
            ) : (
              <>
                <div>
                  <label htmlFor="pay-name" className="text-[13px] font-medium">
                    Full name
                  </label>
                  <input
                    id="pay-name"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-line-strong bg-panel px-3 text-[14px]"
                  />
                </div>
                <div>
                  <label htmlFor="pay-email" className="text-[13px] font-medium">
                    Email for the receipt
                  </label>
                  <input
                    id="pay-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-line-strong bg-panel px-3 text-[14px]"
                  />
                </div>
              </>
            )}
            {error &&
              ("kind" in error ? (
                <ErrorNotice error={error as ApiError} onRetry={() => pay()} />
              ) : (
                <Notice tone="danger" title="Checkout could not open">
                  {error.message}
                </Notice>
              ))}
            {!showSimulator && (
              <Button type="submit" size="lg" className="w-full" disabled={busy || inFlight}>
                {busy ? "Creating order…" : "Continue to payment"}
              </Button>
            )}
          </form>
        ) : null}

        {order && showSimulator && <SandboxSimulator order={order} onOutcome={simulate} />}

        <div className="mt-3">
          <PaymentStatus
            state={state}
            closedByUser={closedByUser}
            onCheckAgain={() => order && polling.start(order)}
            onRetry={retry}
          />
        </div>

        <p className="mt-4 text-[12px] text-t4">
          Pro switches on only after our server confirms payment with Kora. A success message in the browser alone
          never unlocks anything.
        </p>
      </Section>
    </div>
  );
}
