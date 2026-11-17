// The axios instances every service uses.
//
//   http      -> {API_URL}/v1   all versioned routes
//   rootHttp  -> {API_URL}      unversioned routes (/health)
//
// Interceptors attach a bearer token when one is provided, swap in the fixture adapter
// in sample mode, and turn every failure into an ApiError.

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_PREFIX, API_URL, TIMEOUTS } from "./config";
import { asApiError } from "./errors";
import { isFixtureMode } from "./mode";

// ---------- Auth ----------

// There is no sign-in, so no token by default. Plug one in here if the API needs it.
let tokenProvider: () => Promise<string | null> = async () => null;

/** Set where the bearer token comes from (tests, or a future auth provider). */
export function setAccessTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

// ---------- Query strings ----------

type QueryValue = string | number | boolean | string[] | null | undefined;

/** Drops empty values; arrays go as one comma-joined value, as the API expects. */
function serializeParams(params: Record<string, QueryValue>): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) out.set(k, v.join(","));
    } else out.set(k, String(v));
  }
  return out.toString();
}

// ---------- Fixture adapter ----------

/** Serves a request from lib/mock/server.ts with the same shapes as the live API. */
const fixtureAdapter: AxiosAdapter = async (config) => {
  const { handle, MockHttpError } = await import("@/lib/mock/server");
  const method = (config.method ?? "get").toUpperCase();
  const prefix = (config.baseURL ?? "").slice(API_URL.length);
  const path = `${prefix}${config.url ?? ""}`;
  const data = config.data;
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;
  let body: unknown = undefined;
  if (!isForm && typeof data === "string" && data) body = JSON.parse(data);
  else if (!isForm && data !== undefined) body = data;
  const headers = AxiosHeaders.from(config.headers);

  try {
    const result = await handle(method, path, {
      query: config.params,
      body,
      form: isForm ? data : undefined,
      idempotencyKey: (headers.get("Idempotency-Key") as string | undefined) ?? undefined,
    });
    return { data: result, status: 200, statusText: "OK", headers: {}, config, request: {} };
  } catch (e) {
    if (!(e instanceof MockHttpError)) throw e;
    const response = { data: { detail: e.detail }, status: e.status, statusText: "", headers: {}, config, request: {} };
    throw new AxiosError(e.message, AxiosError.ERR_BAD_REQUEST, config, {}, response);
  }
};

// ---------- Instances ----------

async function prepare(config: InternalAxiosRequestConfig) {
  if (isFixtureMode()) {
    config.adapter = fixtureAdapter;
    return config;
  }
  const token = await tokenProvider();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
}

function create(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: TIMEOUTS.default,
    headers: { Accept: "application/json" },
    paramsSerializer: { serialize: serializeParams },
  });
  instance.interceptors.request.use(prepare);
  instance.interceptors.response.use(
    (res) => res,
    (error) => Promise.reject(asApiError(error)),
  );
  return instance;
}

/** Versioned routes: services call `http.get("/transactions")` for GET {API_URL}/v1/transactions. */
export const http = create(`${API_URL}${API_PREFIX}`);

/** Routes outside the version prefix, such as /health. */
export const rootHttp = create(API_URL);

/**
 * For file uploads. The docs declare multipart/form-data with a binary `file`
 * field; axios adds the boundary itself, so never hand-write one.
 */
export const MULTIPART = { "Content-Type": "multipart/form-data" } as const;

/** A fresh key per user action; a retry of the same action reuses it. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
