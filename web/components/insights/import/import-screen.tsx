"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { asApiError } from "@/hooks/use-resource";
import { api, newIdempotencyKey, type ApiError } from "@/lib/api";
import { loadSampleFile } from "@/lib/sample";
import type { ImportPreview, ImportRecord } from "@/types/api";
import { ErrorNotice } from "../shared/error-notice";
import { DoneView } from "./done-view";
import { FilePicker } from "./file-picker";
import { PastImports } from "./past-imports";
import { PreviewView } from "./preview-view";
import { SamplePanel } from "./sample-panel";
import { Stepper, type ImportStep } from "./stepper";

const MAX_BYTES = 5 * 1024 * 1024;

/** Client checks only: extension and size. The API validates every row. */
function clientCheck(f: File): string | null {
  if (!f.name.toLowerCase().endsWith(".csv"))
    return `"${f.name}" is not a CSV file. Export your statement as .csv and try again.`;
  if (f.size > MAX_BYTES) return `"${f.name}" is larger than 5 MB. Split it into smaller date ranges and import each one.`;
  return null;
}

export function ImportScreen() {
  const params = useSearchParams();
  const [step, setStep] = useState<ImportStep>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [record, setRecord] = useState<ImportRecord | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  // One key per confirm action; a retry of the same confirm reuses it.
  const keyRef = useRef<string | null>(null);
  const autoSample = useRef(false);

  async function check(f: File) {
    setError(null);
    const problem = clientCheck(f);
    setClientError(problem);
    if (problem) return;
    setBusy(true);
    setFile(f);
    keyRef.current = null;
    try {
      setPreview(await api.previewImport(f));
      setStep("check");
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function checkSample() {
    setBusy(true);
    try {
      await check(await loadSampleFile());
    } catch {
      setBusy(false);
      setClientError("The sample file could not be loaded. Reload the page and try again.");
    }
  }

  async function confirm() {
    if (!file) return;
    keyRef.current ??= newIdempotencyKey();
    setBusy(true);
    setError(null);
    try {
      setRecord(await api.commitImport(file, keyRef.current));
      setStep("done");
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep("choose");
    setPreview(null);
    setFile(null);
    setError(null);
  }

  // "Try with sample data" from other screens lands here with ?sample=1.
  useEffect(() => {
    if (params.get("sample") === "1" && !autoSample.current) {
      autoSample.current = true;
      void checkSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <>
      <PageHeader
        title="Import transactions"
        description="Upload a CSV export. SpendLens checks every row first and shows you what it found before saving anything."
      />
      <Stepper step={step} />

      {step === "choose" && (
        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <FilePicker onFile={check} busy={busy} />
            {busy && <Spinner label="Checking your file" />}
            {clientError && (
              <Notice tone="danger" title="That file can't be used">
                {clientError}
              </Notice>
            )}
            {error && <ErrorNotice error={error} onRetry={file ? () => check(file) : undefined} />}
          </div>
          <SamplePanel onUseSample={checkSample} busy={busy} />
        </div>
      )}

      {step === "check" && preview && (
        <PreviewView preview={preview} busy={busy} error={error} onConfirm={confirm} onBack={reset} />
      )}

      {step === "done" && record && <DoneView record={record} />}

      {step !== "check" && <PastImports key={record?.id ?? "none"} />}
    </>
  );
}
