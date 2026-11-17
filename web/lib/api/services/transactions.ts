import type { Page, ReviewState, Transaction, TransactionQuery } from "@/types/api";
import { http } from "../client";

export type ReconciliationChoice = "same" | "different";

/** The API calls a match "confirmed" and a non-match "rejected". */
const reconciliationState: Record<ReconciliationChoice, "confirmed" | "rejected"> = {
  same: "confirmed",
  different: "rejected",
};

/** GET/PATCH /v1/transactions and POST /v1/reconciliation/confirm. */
export const transactionsService = {
  list: (query: TransactionQuery = {}) =>
    http.get<Page<Transaction>>("/transactions", { params: query }).then((r) => r.data),

  update: (id: string, patch: { category?: string; review_state?: ReviewState }) =>
    http.patch<Transaction>(`/transactions/${encodeURIComponent(id)}`, patch).then((r) => r.data),

  confirmReconciliation: (candidate_id: string, choice: ReconciliationChoice) =>
    http
      .post<Record<string, unknown>>("/reconciliation/confirm", {
        candidate_id,
        state: reconciliationState[choice],
      })
      .then((r) => r.data),
};
