"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/api";

export type PollState =
  | { phase: "idle" }
  | { phase: "polling"; order: Order }
  | { phase: "settled"; order: Order }
  | { phase: "timed_out"; order: Order }
  | { phase: "error"; order: Order; message: string };

const TERMINAL: OrderStatus[] = ["paid", "underpaid", "overpaid", "failed", "cancelled", "expired"];

/** Polls GET /v1/billing/orders/{id} every 3 s until it settles or the time runs out. */
export function useOrderPolling({ intervalMs = 3000, timeoutMs = 120_000 } = {}) {
  const [state, setState] = useState<PollState>({ phase: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useRef(0);

  const stop = useCallback(() => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(
    (order: Order) => {
      stop();
      const id = run.current;
      const startedAt = Date.now();
      setState({ phase: "polling", order });

      const tick = async () => {
        if (id !== run.current) return;
        try {
          const latest = await api.order(order.id);
          if (id !== run.current) return;
          if (TERMINAL.includes(latest.status)) return setState({ phase: "settled", order: latest });
          if (Date.now() - startedAt >= timeoutMs) return setState({ phase: "timed_out", order: latest });
          setState({ phase: "polling", order: latest });
        } catch (e) {
          if (id !== run.current) return;
          if (Date.now() - startedAt >= timeoutMs)
            return setState({ phase: "error", order, message: e instanceof Error ? e.message : "Status check failed." });
        }
        timer.current = setTimeout(tick, intervalMs);
      };
      void tick();
    },
    [intervalMs, timeoutMs, stop],
  );

  const reset = useCallback(() => {
    stop();
    setState({ phase: "idle" });
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { state, start, stop, reset };
}
