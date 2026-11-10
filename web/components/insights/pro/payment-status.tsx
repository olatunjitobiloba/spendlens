import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import type { PollState } from "@/hooks/use-order-polling";

/**
 * Every payment outcome in words (technical doc §9): pending, paid,
 * underpaid, overpaid, failed, cancelled by user, timed out.
 */
export function PaymentStatus({
  state,
  closedByUser,
  onCheckAgain,
  onRetry,
}: {
  state: PollState;
  closedByUser: boolean;
  onCheckAgain: () => void;
  onRetry: () => void;
}) {
  if (state.phase === "idle") return null;
  const order = state.order;
  const again = (
    <Button size="sm" variant="outline" onClick={onCheckAgain}>
      Check again
    </Button>
  );
  const retry = (
    <Button size="sm" onClick={onRetry}>
      Try payment again
    </Button>
  );

  if (state.phase === "polling") {
    if (closedByUser) {
      return (
        <Notice title="Checkout closed" action={retry}>
          You closed Kora Checkout. If you finished paying, Pro switches on here as soon as our server confirms it.{" "}
          <Spinner label="Still checking" className="mt-1" />
        </Notice>
      );
    }
    return (
      <Notice title="Waiting for payment confirmation">
        Pro unlocks only after our server hears from Kora. This page checks every few seconds.{" "}
        <Spinner label="Checking" className="mt-1" />
      </Notice>
    );
  }

  if (state.phase === "timed_out" || state.phase === "error") {
    return (
      <Notice tone="warn" title="No confirmation yet" action={<>{again}{retry}</>}>
        We have not heard back from Kora for reference <span className="font-mono">{order.reference}</span>. If money
        left your account, Pro switches on once it is confirmed. Nothing is charged twice for this order.
      </Notice>
    );
  }

  switch (order.status) {
    case "paid":
      return (
        <Notice tone="positive" title="Payment confirmed. Pro is on.">
          Our server received <Money kobo={order.amount_paid_kobo ?? order.amount_kobo} /> for reference{" "}
          <span className="font-mono">{order.reference}</span>.
        </Notice>
      );
    case "overpaid":
      return (
        <Notice tone="positive" title="Payment confirmed. Pro is on.">
          We received <Money kobo={order.amount_paid_kobo ?? 0} />, more than the <Money kobo={order.amount_kobo} />{" "}
          price. Contact support with reference <span className="font-mono">{order.reference}</span> about the
          difference.
        </Notice>
      );
    case "underpaid":
      return (
        <Notice tone="warn" title="Payment was less than the price" action={retry}>
          We received <Money kobo={order.amount_paid_kobo ?? 0} /> of <Money kobo={order.amount_kobo} />, so Pro is not
          on yet. Contact support with reference <span className="font-mono">{order.reference}</span>.
        </Notice>
      );
    case "failed":
      return (
        <Notice tone="danger" title="Payment failed" action={retry}>
          Kora reported the payment as failed. No Pro access was given. You can try again with the same or another
          method.
        </Notice>
      );
    case "cancelled":
    case "expired":
      return (
        <Notice title={order.status === "cancelled" ? "Payment cancelled" : "Order expired"} action={retry}>
          Nothing was charged for this order. Start a new payment whenever you are ready.
        </Notice>
      );
    default:
      return null;
  }
}
