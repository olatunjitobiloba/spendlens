import type { Analysis } from "@/types/api";
import { http } from "../client";

export type AnalysisQuery = { start?: string; end?: string; compare?: "previous" };

/** GET /v1/analysis. */
export const analysisService = {
  get: (query: AnalysisQuery = {}) => http.get<Analysis>("/analysis", { params: query }).then((r) => r.data),
};
