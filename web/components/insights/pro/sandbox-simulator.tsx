"use client";

import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import type { SandboxOutcome } from "@/lib/mock/server";
import type { Order } from "@/types/api";

const outcomes: { id: SandboxOutcome | "close"; label: string }[] = [
  { id: "paid", label: "Pay in full" },
  { id: "underpaid", label: "Pay too little" },
  { id: "overpaid", label: "Pay too much" },
  { id: "failed", label: "Card declined" },
  { id: "close", label: "Close without paying" },
  { id: "no_answer", label: "Never confirm" },
];

/**
 * Sample mode only. Stands in for Kora Checkout so every payment state can be
 * shown without a sandbox key. It changes the fixture order, then the page
 * learns the result by polling, exactly as in live mode.
 */
export function SandboxSimulator({
  order,
  onOutcome,
}: {
  order: Order;
  onOutcome: (outcome: SandboxOutcome | "close") => void;
}) {
  return (
    <div role="dialog" aria-label="Simulated checkout" className="rounded-2xl border border-dashed border-warn/50 p-4">
      <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-[600]">
        <Status tone="warn">Sample mode</Status>
        Simulated checkout
      </p>
      <p className="mt-1 text-[13px] text-t3">
        No real payment. Pick what Kora would report for order <span className="font-mono">{order.reference}</span>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {outcomes.map((o) => (
          <Button key={o.id} size="sm" variant={o.id === "paid" ? "default" : "outline"} onClick={() => onOutcome(o.id)}>
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
