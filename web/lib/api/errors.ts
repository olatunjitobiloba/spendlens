// One error type for every API failure, so screens can decide how to show it:
// action failures go to a toast, field failures sit under the input.

import { isAxiosError, isCancel } from "axios";

export type ApiErrorKind =
  | "asleep" // network failure, timeout or 502/503/504: the service is waking or down
  | "unauthorized"
  | "validation"
  | "unsupported_file"
  | "password_required" // an encrypted PDF arrived without a password
  | "password_invalid" // the password did not open it
  | "pro_required"
  | "not_found"
  | "conflict"
  | "server"
  | "aborted";

/** Field name -> first message, from FastAPI's 422 `detail[].loc`. */
export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
    public detail?: unknown,
    public fields: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** The message for one input, if the API rejected that field. */
  field(name: string): string | undefined {
    return this.fields[name];
  }

  get hasFieldErrors() {
    return Object.keys(this.fields).length > 0;
  }
}

type PydanticIssue = { loc?: (string | number)[]; msg?: string };

function issues(detail: unknown): PydanticIssue[] {
  return Array.isArray(detail) ? (detail as PydanticIssue[]).filter((d) => d && typeof d.msg === "string") : [];
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string")
    return detail.message;
  return issues(detail)[0]?.msg ?? null;
}

function detailCode(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "code" in detail && typeof detail.code === "string") return detail.code;
  return null;
}

/** Pydantic says "Value error, x"; people only need "x". */
function cleanMsg(msg: string) {
  return msg.replace(/^Value error, /, "");
}

/** "file must be CSV" -> "File must be CSV." */
function sentence(msg: string) {
  const s = msg.trim();
  return `${s[0].toUpperCase()}${s.slice(1)}${/[.!?]$/.test(s) ? "" : "."}`;
}

function fieldErrors(detail: unknown): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues(detail)) {
    // loc is ["body", "target_kobo"] or ["query", "page"]; the last string is the field.
    const name = [...(issue.loc ?? [])].reverse().find((p): p is string => typeof p === "string");
    if (name && !["body", "query", "path", "header"].includes(name) && !out[name])
      out[name] = cleanMsg(issue.msg!);
  }
  return out;
}

function passwordKind(status: number, detail: unknown): ApiErrorKind | null {
  const text = `${detailCode(detail) ?? ""} ${detailMessage(detail) ?? ""}`.toLowerCase();
  if (!text.includes("password") || status < 400 || status >= 500) return null;
  return /invalid|incorrect|wrong|could not|failed/.test(text) ? "password_invalid" : "password_required";
}

/** Map an HTTP status and FastAPI `detail` to an ApiError. */
export function toApiError(status: number, detail: unknown): ApiError {
  const msg = detailMessage(detail);
  const fields = fieldErrors(detail);

  const pw = passwordKind(status, detail);
  if (pw === "password_invalid")
    return new ApiError(pw, "That password did not open the file. Check it and try again.", status, detail);
  if (pw === "password_required")
    return new ApiError(pw, "This file is password protected. Enter its password to continue.", status, detail);

  if (status === 402 || detail === "pro_required")
    return new ApiError("pro_required", "This needs SpendLens Pro.", status, detail);
  if (status === 401 || (status === 403 && /not authenticated/i.test(msg ?? "")))
    return new ApiError(
      "unauthorized",
      "The live API wants a signed-in user for this, and this app has no sign-in. Use sample mode, or open this route up on the API.",
      status,
      detail,
    );
  if (status === 404) return new ApiError("not_found", msg ?? "We could not find that.", status, detail);
  if (status === 409) return new ApiError("conflict", msg ?? "That changed while you were working.", status, detail);
  if (status === 413) return new ApiError("unsupported_file", "That file is too large to upload.", status, detail);
  if (status === 415)
    return new ApiError("unsupported_file", msg ? sentence(msg) : "That file type is not supported.", status, detail);
  if (status === 400 || status === 422)
    return new ApiError("validation", sentence(cleanMsg(msg ?? "Some of the details were not accepted.")), status, detail, fields);
  if (status === 502 || status === 503 || status === 504)
    return new ApiError("asleep", "The SpendLens service is not answering.", status, detail);
  return new ApiError("server", msg ?? "Something went wrong on our side.", status, detail);
}

/** Normalise anything thrown by axios (or by our own code) into an ApiError. */
export function asApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (isCancel(e)) return new ApiError("aborted", "Cancelled.");
  if (isAxiosError(e)) {
    if (e.response) {
      const data = e.response.data as { detail?: unknown } | null;
      return toApiError(e.response.status, data?.detail ?? data);
    }
    // No response: offline, CORS refusal, timeout, or a cold server.
    return new ApiError("asleep", "The SpendLens service is not answering.");
  }
  return new ApiError("server", "Something went wrong on our side.");
}
