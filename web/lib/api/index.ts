// The one client for the SpendLens API. Screens import `api` and call a
// service by resource: `api.imports.preview(...)`, `api.transactions.list(...)`.
// Each service maps to a tag in https://spendlens-api-8tnt.onrender.com/docs.

import { analysisService } from "./services/analysis";
import { chatService } from "./services/chat";
import { goalsService } from "./services/goals";
import { healthService } from "./services/health";
import { importsService } from "./services/imports";
import { insightsService } from "./services/insights";
import { transactionsService } from "./services/transactions";

export const api = {
  health: healthService,
  imports: importsService,
  transactions: transactionsService,
  analysis: analysisService,
  chat: chatService,
  insights: insightsService,
  goals: goalsService,
};

export { http, rootHttp, newIdempotencyKey, setAccessTokenProvider } from "./client";
export { API_PREFIX, TIMEOUTS } from "./config";
export { ApiError, asApiError, toApiError, type ApiErrorKind, type FieldErrors } from "./errors";
export { isFixtureMode, liveApiConfigured, liveModeBlocker, setFixtureOverride } from "./mode";
export type { StatementUpload } from "./services/imports";
export type { ReconciliationChoice } from "./services/transactions";
