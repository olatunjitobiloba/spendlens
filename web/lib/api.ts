// The one client for the SpendLens API (frontend technical doc §4).
// In fixture mode every call goes to lib/mock/server.ts instead, which
// returns the same shapes from the synthetic data in /public/fixtures.

import type {
  Analysis,
  ChatReply,
  ChatRequest,
  Explanation,
  Forecast,
  GoalInput,
  GoalProjection,
  Health,
  ImportPreview,
  ImportRecord,
  Me,
  Order,
  Page,
  Protections,
  RecurringCandidate,
  ReviewState,
  Scenario,
  ScenarioRequest,
  Transaction,
  TransactionQuery,
  Transcription,
} from "@/types/api";

import { getAccessToken } from "@/lib/supabase/client";
import { API_URL, MODE_COOKIE, envFixtureMode } from "@/configs/env";

const ENV_FIXTURES = envFixtureMode;

const DEFAULT_TIMEOUT_MS = 60_000; // free-tier cold starts take 30 to 50 seconds
export const EXPLANATION_TIMEOUT_MS = 25_000;
const CHAT_TIMEOUT_MS = 45_000;

// ---------- Mode ----------

/** True when calls are served from fixtures instead of the live API. */
export function isFixtureMode(): boolean {
  if (ENV_FIXTURES) return true;
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`${MODE_COOKIE}=fixtures`);
}

/** Whether the live API is configured at all, so a switch back makes sense. */
export const liveApiConfigured = Boolean(API_URL);

/** A cookie, not localStorage, so proxy.ts can let sample mode through without login. */
export function setFixtureOverride(on: boolean) {
  document.cookie = on
    ? `${MODE_COOKIE}=fixtures; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${MODE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

// ---------- Auth ----------

let tokenProvider: () => Promise<string | null> = getAccessToken;

/** Override the token source (tests). Defaults to the Supabase session. */
export function setAccessTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

// ---------- Errors ----------

export type ApiErrorKind =
  | "asleep" // network failure, timeout or 502/503/504: the service is waking or down
  | "validation"
  | "pro_required"
  | "not_found"
  | "conflict"
  | "server"
  | "aborted";

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0] && typeof detail[0].msg === "string") return detail[0].msg;
  return null;
}

function toApiError(status: number, detail: unknown): ApiError {
  const msg = detailMessage(detail);
  if (status === 402 || detail === "pro_required")
    return new ApiError("pro_required", "This needs SpendLens Pro.", status, detail);
  if (status === 404) return new ApiError("not_found", msg ?? "We could not find that.", status, detail);
  if (status === 409) return new ApiError("conflict", msg ?? "That changed while you were working.", status, detail);
  if (status === 400 || status === 422)
    return new ApiError("validation", msg ?? "Some of the details were not accepted.", status, detail);
  if (status === 502 || status === 503 || status === 504)
    return new ApiError("asleep", "The SpendLens service is not answering.", status, detail);
  return new ApiError("server", msg ?? "Something went wrong on our side.", status, detail);
}

// ---------- Transport ----------

type RequestOptions = {
  query?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
  form?: FormData;
  idempotencyKey?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
};

function buildQuery(query: RequestOptions["query"]): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) params.set(k, v.join(","));
    } else params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  if (isFixtureMode()) {
    const { handle, MockHttpError } = await import("@/lib/mock/server");
    try {
      return (await handle(method, path, {
        query: opts.query,
        body: opts.body,
        form: opts.form,
        idempotencyKey: opts.idempotencyKey,
      })) as T;
    } catch (e) {
      if (e instanceof MockHttpError) throw toApiError(e.status, e.detail);
      throw e;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onAbort = () => controller.abort("caller");
  opts.signal?.addEventListener("abort", onAbort);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = await tokenProvider();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(opts.query)}`, {
      method,
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: controller.signal,
    });
  } catch {
    if (opts.signal?.aborted) throw new ApiError("aborted", "Cancelled.");
    throw new ApiError("asleep", "The SpendLens service is not answering.");
  } finally {
    clearTimeout(timeout);
    opts.signal?.removeEventListener("abort", onAbort);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(res.status, data?.detail ?? data);
  return data as T;
}

// ---------- Endpoints ----------

function csvForm(file: File) {
  const form = new FormData();
  form.set("file", file);
  return form;
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("GET", "/health", { signal }),

  previewImport: (file: File) =>
    request<ImportPreview>("POST", "/v1/imports/preview", { form: csvForm(file) }),
  /** Reuse the same key when retrying the same confirm. */
  commitImport: (file: File, idempotencyKey: string) =>
    request<ImportRecord>("POST", "/v1/imports", { form: csvForm(file), idempotencyKey }),
  deleteImport: (id: string) => request<void>("DELETE", `/v1/imports/${encodeURIComponent(id)}`),

  transactions: (q: TransactionQuery = {}) =>
    request<Page<Transaction>>("GET", "/v1/transactions", { query: q }),
  updateTransaction: (id: string, patch: { category?: string; review_state?: ReviewState }) =>
    request<Transaction>("PATCH", `/v1/transactions/${encodeURIComponent(id)}`, { body: patch }),
  confirmReconciliation: (candidate_id: string, decision: "same" | "different") =>
    request<{ ok: true }>("POST", "/v1/reconciliation/confirm", { body: { candidate_id, decision } }),

  analysis: (q: { start?: string; end?: string; compare?: "previous" } = {}) =>
    request<Analysis>("GET", "/v1/analysis", { query: q }),

  setProtections: (categories: string[]) =>
    request<Protections>("PUT", "/v1/protections", { body: { categories } }),

  createScenario: (req: ScenarioRequest) => request<Scenario>("POST", "/v1/scenarios", { body: req }),
  savedScenarios: () => request<Scenario[]>("GET", "/v1/scenarios"),
  explainScenario: (id: string, signal?: AbortSignal) =>
    request<Explanation>("POST", `/v1/scenarios/${encodeURIComponent(id)}/explanation`, {
      timeoutMs: EXPLANATION_TIMEOUT_MS,
      signal,
    }),

  me: () => request<Me>("GET", "/v1/me"),
  createOrder: (idempotencyKey: string) =>
    request<Order>("POST", "/v1/billing/orders", { body: { product: "pro_30d" }, idempotencyKey }),
  order: (id: string) => request<Order>("GET", `/v1/billing/orders/${encodeURIComponent(id)}`),

  forecast: () => request<Forecast>("GET", "/v1/forecast"),
  recurring: () => request<RecurringCandidate[]>("GET", "/v1/recurring"),

  deleteMyData: () => request<void>("DELETE", "/v1/me/data"),
  projectGoal: (input: GoalInput) =>
    request<GoalProjection>("POST", "/v1/goals/project", { body: input }),

  chat: (req: ChatRequest, signal?: AbortSignal) =>
    request<ChatReply>("POST", "/v1/chat", { body: req, timeoutMs: CHAT_TIMEOUT_MS, signal }),
  /** A recorded voice note in, its text out. The text is then sent through `chat`. */
  transcribe: (audio: Blob, signal?: AbortSignal) => {
    const form = new FormData();
    const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
    form.set("file", audio, `voice-note.${ext}`);
    return request<Transcription>("POST", "/v1/chat/transcriptions", { form, timeoutMs: CHAT_TIMEOUT_MS, signal });
  },
};
