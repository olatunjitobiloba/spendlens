import type { ImportPreview, ImportRecord } from "@/types/api";
import { MULTIPART, http } from "../client";
import { TIMEOUTS } from "../config";

export type StatementUpload = {
  /** A CSV, or a PDF. Locked PDFs are unlocked in the browser first (utils/pdf.ts). */
  file: File;
};

/**
 * The API checks the part's MIME type against a CSV allow-list. Browsers take
 * it from the OS, and Windows often labels .csv as an Excel type (415), so a
 * .csv is always sent as text/csv. Other files keep their own type.
 */
function asUploadFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv") return file;
  return new File([file], file.name, { type: "text/csv", lastModified: file.lastModified });
}

function statementForm({ file }: StatementUpload) {
  const form = new FormData();
  form.set("file", asUploadFile(file));
  return form;
}

/** POST /v1/imports/preview and POST /v1/imports, both multipart/form-data with one `file` field. */
export const importsService = {
  /** Reads the statement and reports what it found. Saves nothing. */
  preview: (upload: StatementUpload) =>
    http
      .post<ImportPreview>("/imports/preview", statementForm(upload), { headers: MULTIPART, timeout: TIMEOUTS.upload })
      .then((r) => r.data),

  /** Saves the statement. Reuse the same key when retrying the same confirm. */
  commit: (upload: StatementUpload, idempotencyKey: string) =>
    http
      .post<ImportRecord>("/imports", statementForm(upload), {
        headers: { ...MULTIPART, "Idempotency-Key": idempotencyKey },
        timeout: TIMEOUTS.upload,
      })
      .then((r) => r.data),
};
