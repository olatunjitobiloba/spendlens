import type { ImportPreview, ImportRecord } from "@/types/api";
import { http } from "../client";
import { TIMEOUTS } from "../config";

export type StatementUpload = {
  file: File;
  /** Only for password-protected PDF statements. Sent once with the file, never stored. */
  password?: string;
};

function statementForm({ file, password }: StatementUpload) {
  const form = new FormData();
  form.set("file", file);
  if (password) form.set("password", password);
  return form;
}

/** POST /v1/imports/preview and POST /v1/imports. */
export const importsService = {
  /** Reads the statement and reports what it found. Saves nothing. */
  preview: (upload: StatementUpload) =>
    http
      .post<ImportPreview>("/imports/preview", statementForm(upload), { timeout: TIMEOUTS.upload })
      .then((r) => r.data),

  /** Saves the statement. Reuse the same key when retrying the same confirm. */
  commit: (upload: StatementUpload, idempotencyKey: string) =>
    http
      .post<ImportRecord>("/imports", statementForm(upload), {
        headers: { "Idempotency-Key": idempotencyKey },
        timeout: TIMEOUTS.upload,
      })
      .then((r) => r.data),

  /** Not in the published API docs yet; served by fixtures until it lands. */
  remove: (id: string) => http.delete<void>(`/imports/${encodeURIComponent(id)}`).then(() => undefined),
};
