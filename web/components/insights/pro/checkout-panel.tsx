"use client";

import { useEffect, useRef, useState } from "react";

import { Crown02Icon } from "@hugeicons/core-free-icons";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Spinner } from "@/components/ui/spinner";
import { Notice } from "@/components/ui/notice";
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
import { PlanComparison } from "./pro-features";
import { SandboxSimulator } from "./sandbox-simulator";

// Synthetic customer for sample mode only.
const SAMPLE_CUSTOMER = {
  name: "Tolu Adebayo",
  email: "tolu.sample@example.com",
};

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
  const [open, setOpen] = useState(false);
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
      if (!KORA_PUBLIC_KEY)
        throw new Error("Kora Checkout is not configured on this deployment. Use sample mode to try payment.");
      // Kora opens its own popup; our dialog would trap focus and block it, so step aside
      // and come back with the payment status once Kora reports.
      setOpen(false);
      await openKoraCheckout(
        KORA_PUBLIC_KEY,
        created,
        { name: name.trim(), email: email.trim() },
        {
          // Hints for when to check. They never unlock anything.
          onSuccess: () => {
            setOpen(true);
            polling.start(created);
          },
          onFailed: () => {
            setOpen(true);
            polling.start(created);
          },
          onClose: () => {
            setClosedByUser(true);
            setOpen(true);
            polling.start(created);
          },
        },
      );
      polling.start(created);
    } catch (err) {
      setOpen(true);
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
    <>
      <PlanComparison
        priceKobo={me.pro_price_kobo}
        days={me.pro_days}
        current="free"
        action={
          <Button className="w-full shadow-md shadow-brand/25" onClick={() => setOpen(true)}>
            <Icon icon={Crown02Icon} />
            {state.phase === "idle" ? "Upgrade" : "Payment status"}
          </Button>
        }
      />

      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          if (!busy) setOpen(o);
        }}
      >
        <AlertDialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[1.5rem] border border-line-strong bg-panel p-5 ring-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md sm:p-6">
          <AlertDialogTitle className="text-[17px] font-[650] tracking-[-0.02em]">Upgrade to Pro</AlertDialogTitle>
          <AlertDialogDescription className="mt-1 text-[13px] text-t3">
            Card, bank transfer and other methods Kora supports.
          </AlertDialogDescription>
          <div className="mt-4 mb-4 rounded-2xl bg-brand/[0.07] p-4">
            <p className="text-[12.5px] text-t3">Pay once with Kora</p>
            <p className="mt-1 text-[30px] leading-none font-[650] tracking-[-0.04em]">
              <Money kobo={me.pro_price_kobo} className="font-sans" />
            </p>
            <p className="mt-1.5 text-[12.5px] text-t3">
              {me.pro_days} days of Pro. No auto-renewal. Test price in this demo.
            </p>
          </div>
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
                  {busy && <Spinner />}
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

          <AlertDialogCancel variant="ghost" className="mt-3 w-full" disabled={busy}>
            {state.phase === "idle" ? "Not now" : "Close"}
          </AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
