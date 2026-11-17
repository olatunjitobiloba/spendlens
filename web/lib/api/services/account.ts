// Not in the published API docs yet. Served by fixtures until the backend ships them.

import type { Me, Order } from "@/types/api";
import { http } from "../client";

export const accountService = {
  me: () => http.get<Me>("/me").then((r) => r.data),

  createOrder: (idempotencyKey: string) =>
    http
      .post<Order>("/billing/orders", { product: "pro_30d" }, { headers: { "Idempotency-Key": idempotencyKey } })
      .then((r) => r.data),

  order: (id: string) => http.get<Order>(`/billing/orders/${encodeURIComponent(id)}`).then((r) => r.data),

  deleteMyData: () => http.delete<void>("/me/data").then(() => undefined),
};
