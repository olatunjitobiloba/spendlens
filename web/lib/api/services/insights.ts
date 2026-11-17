import type { HabitAudit, InvestmentOption, InvestmentProjection, ProjectionInput, SubscriptionItem } from "@/types/api";
import { http } from "../client";

/** GET /v1/habits, GET /v1/subscriptions, and the /v1/investments routes. */
export const insightsService = {
  habits: () => http.get<HabitAudit>("/habits").then((r) => r.data),

  subscriptions: () => http.get<SubscriptionItem[]>("/subscriptions").then((r) => r.data),

  investmentSuggestions: (query: { monthly_spare_kobo?: number; horizon_months?: number } = {}) =>
    http.get<InvestmentOption[]>("/investments/suggestions", { params: query }).then((r) => r.data),

  projectInvestment: (input: ProjectionInput) =>
    http.post<InvestmentProjection>("/investments/project", input).then((r) => r.data),
};
