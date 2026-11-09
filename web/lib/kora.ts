// Kora Checkout Standard. Loaded only on the Pro page (technical doc §9).
// Callbacks are UX hints only. Pro unlocks when our backend says the order is paid.

import type { Order } from "@/types/api";

const KORA_SCRIPT = "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";

type KoraOptions = {
  key: string;
  reference: string;
  amount: number;
  currency: string;
  customer: { name: string; email: string };
  notification_url: string;
  onClose?: () => void;
  onSuccess?: (data: unknown) => void;
  onFailed?: (data: unknown) => void;
  onPending?: (data: unknown) => void;
};

declare global {
  interface Window {
    Korapay?: { initialize: (options: KoraOptions) => void; close?: () => void };
  }
}

let loading: Promise<void> | null = null;

export function loadKora(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.Korapay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = KORA_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Kora Checkout could not load."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type KoraEvents = {
  onClose: () => void;
  onSuccess: () => void;
  onFailed: () => void;
};

/** Opens checkout with values from the order, never typed in the client. */
export async function openKoraCheckout(
  publicKey: string,
  order: Order,
  customer: { name: string; email: string },
  events: KoraEvents,
) {
  await loadKora();
  window.Korapay!.initialize({
    key: publicKey,
    reference: order.reference,
    amount: order.amount,
    currency: order.currency,
    customer,
    notification_url: order.notification_url,
    onClose: events.onClose,
    onSuccess: events.onSuccess,
    onFailed: events.onFailed,
    onPending: events.onSuccess,
  });
}
