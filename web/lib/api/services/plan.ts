// Not in the published API docs yet. The calls follow the frontend technical
// doc and are served by fixtures until the backend ships them.

import type { Explanation, Forecast, Protections, RecurringCandidate, Scenario, ScenarioRequest } from "@/types/api";
import { http } from "../client";
import { TIMEOUTS } from "../config";

export const planService = {
  setProtections: (categories: string[]) =>
    http.put<Protections>("/protections", { categories }).then((r) => r.data),

  createScenario: (req: ScenarioRequest) => http.post<Scenario>("/scenarios", req).then((r) => r.data),

  savedScenarios: () => http.get<Scenario[]>("/scenarios").then((r) => r.data),

  explainScenario: (id: string, signal?: AbortSignal) =>
    http
      .post<Explanation>(`/scenarios/${encodeURIComponent(id)}/explanation`, undefined, {
        timeout: TIMEOUTS.explanation,
        signal,
      })
      .then((r) => r.data),

  forecast: () => http.get<Forecast>("/forecast").then((r) => r.data),

  recurring: () => http.get<RecurringCandidate[]>("/recurring").then((r) => r.data),
};
