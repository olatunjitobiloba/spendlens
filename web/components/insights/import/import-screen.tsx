"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { showToast } from "@/components/ui/toast";
import { api, asApiError, newIdempotencyKey, type StatementUpload } from "@/lib/api";
import { loadSampleFile } from "@/lib/sample";
import type { ImportPreview, ImportRecord } from "@/types/api";
import { PdfPasswordError, isEncryptedPdf, isPdf, unlockPdf } from "@/utils/pdf";
import { toastApiError } from "../shared/error-toast";
import { DoneView } from "./done-view";
import { FilePicker } from "./file-picker";
import { PastImports } from "./past-imports";
import { PdfPasswordDialog } from "./pdf-password-dialog";
import { PreviewView } from "./preview-view";
import { SampleDialog } from "./sample-dialog";
import { Stepper, type ImportStep } from "./stepper";

const MAX_BYTES = 5 * 1024 * 1024;

/** Client checks only: type and size. The API validates every row. */
function clientCheck(f: File): string | null {
  if (!f.name.toLowerCase().endsWith(".csv") && !isPdf(f))
    return `"${f.name}" is not a CSV or PDF. Export your statement as either and try again.`;
  if (f.size > MAX_BYTES) return `"${f.name}" is larger than 5 MB. Split it into smaller date ranges and import each one.`;
  return null;
}

type Locked = { file: File; error: string | null; attempt: number };

export function ImportScreen() {
  const params = useSearchParams();
  const [step, setStep] = useState<ImportStep>("choose");
  const [upload, setUpload] = useState<StatementUpload | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [record, setRecord] = useState<ImportRecord | null>(null);
  const [locked, setLocked] = useState<Locked | null>(null);
  const [busy, setBusy] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  // One key per confirm action; a retry of the same confirm reuses it.
  const keyRef = useRef<string | null>(null);
  const autoSample = useRef(false);

  /** Upload for a preview. Failures toast with a retry. */
  async function runPreview(next: StatementUpload) {
    setBusy(true);
    keyRef.current = null;
    try {
      setPreview(await api.imports.preview(next));
      setUpload(next);
      setStep("check");
    } catch (e) {
      const error = asApiError(e);
      if (error.kind === "unsupported_file" && isPdf(next.file)) {
        // The live API reads CSV only; retrying the same PDF can't help.
        showToast({
          tone: "danger",
          title: `Couldn't import ${next.file.name}`,
          description: "SpendLens reads CSV files only for now. Download your statement as CSV from your bank app and import that.",
          code: error.status ? `HTTP ${error.status}` : undefined,
        });
      } else {
        toastApiError(error, { title: `Couldn't read ${next.file.name}`, onRetry: () => void runPreview(next) });
      }
    } finally {
      setBusy(false);
    }
  }

  /**
   * Unlocks a PDF in the browser. Returns the unlocked copy, or null when the
   * password was wrong. Other failures toast and also return null.
   */
  async function tryUnlock(file: File, password: string): Promise<File | null> {
    try {
      return await unlockPdf(file, password);
    } catch (e) {
      if (e instanceof PdfPasswordError) return null;
      showToast({ tone: "danger", title: `Couldn't open ${file.name}`, description: (e as Error).message });
      throw e;
    }
  }

  /** The password from the dialog. Used once, here, and never stored or sent. */
  async function submitPassword(password: string) {
    if (!locked) return;
    setBusy(true);
    try {
      const unlocked = await tryUnlock(locked.file, password);
      if (!unlocked) {
        setLocked({ ...locked, error: new PdfPasswordError().message, attempt: locked.attempt + 1 });
        return;
      }
      setLocked(null);
      await runPreview({ file: unlocked });
    } catch {
      setLocked(null);
    } finally {
      setBusy(false);
    }
  }

  async function check(f: File) {
    const problem = clientCheck(f);
    if (problem) {
      showToast({ tone: "danger", title: "That file can't be used", description: problem });
      return;
    }
    if (isPdf(f) && (await isEncryptedPdf(f).catch(() => false))) {
      // Some PDFs are locked against printing only and open with no password.
      setBusy(true);
      const open = await tryUnlock(f, "").catch(() => undefined);
      setBusy(false);
      if (open === undefined) return; // damaged file; already toasted
      if (open) return runPreview({ file: open });
      setLocked({ file: f, error: null, attempt: 0 });
      return;
    }
    await runPreview({ file: f });
  }

  async function checkSample() {
    setBusy(true);
    try {
      await check(await loadSampleFile());
    } catch {
      setBusy(false);
      showToast({
        tone: "danger",
        title: "Sample file didn't load",
        description: "Reload the page and try again.",
      });
    } finally {
      setSampleOpen(false);
    }
  }

  async function confirm() {
    if (!upload) return;
    keyRef.current ??= newIdempotencyKey();
    setBusy(true);
    try {
      const saved = await api.imports.commit(upload, keyRef.current);
      setRecord(saved);
      setStep("done");
      setUpload(null);
      if (saved.reused)
        showToast({
          tone: "info",
          title: "Already imported",
          description: `${saved.filename} matches an earlier import, so nothing was added twice.`,
        });
    } catch (e) {
      toastApiError(e, { title: "Import failed", onRetry: () => void confirm() });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep("choose");
    setPreview(null);
    setUpload(null);
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
        description="Upload a CSV export or a PDF bank statement. SpendLens checks every row first and shows you what it found before saving anything."
      />
      <Stepper step={step} />

      {step === "choose" && (
        <div className="space-y-3">
          <FilePicker
            onFile={check}
            onTrySample={() => setSampleOpen(true)}
            onUseSample={() => void checkSample()}
            busy={busy && !locked}
          />
          <SampleDialog open={sampleOpen} onOpenChange={setSampleOpen} onUseSample={checkSample} busy={busy} />
        </div>
      )}

      {step === "check" && preview && (
        <PreviewView preview={preview} busy={busy} onConfirm={confirm} onBack={reset} />
      )}

      {step === "done" && record && <DoneView record={record} />}

      {step !== "check" && <PastImports key={record?.id ?? "none"} />}

      <PdfPasswordDialog
        file={locked?.file ?? null}
        busy={busy}
        error={locked?.error ?? null}
        attempt={locked?.attempt ?? 0}
        onSubmit={(password) => void submitPassword(password)}
        onCancel={() => setLocked(null)}
      />
    </>
  );
}
