"use client";

import { useEffect, useRef, useState } from "react";
import { Pdf02Icon, SquareLock02Icon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";

const INPUT_ID = "statement-password";
const ERROR_ID = `${INPUT_ID}-error`;
const HINT_ID = `${INPUT_ID}-hint`;

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Asks for the password of a locked PDF statement. The parent runs the
 * upload; a rejected password comes back as `error` and shows under the field.
 */
export function PdfPasswordDialog({
  file,
  busy,
  error,
  attempt,
  onSubmit,
  onCancel,
}: {
  /** The locked file. The dialog is open while this is set. */
  file: File | null;
  busy: boolean;
  /** Field-level message, e.g. a wrong password. */
  error: string | null;
  /** Goes up on every rejection, so the same message twice still resets the field. */
  attempt: number;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // A new rejection: clear the field and shake it (adjusted during render)...
  const [seenAttempt, setSeenAttempt] = useState(attempt);
  if (attempt !== seenAttempt) {
    setSeenAttempt(attempt);
    if (attempt) {
      setPassword("");
      setShake((n) => n + 1);
    }
  }
  // ...then put the caret back once the field is enabled again.
  useEffect(() => {
    if (attempt && !busy) inputRef.current?.focus();
  }, [attempt, busy]);

  const shown = localError ?? error;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setLocalError("Enter the password for this statement.");
      setShake((n) => n + 1);
      return;
    }
    setLocalError(null);
    onSubmit(password);
  }

  function close() {
    if (busy) return;
    setPassword("");
    setVisible(false);
    setLocalError(null);
    onCancel();
  }

  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-background/45 supports-backdrop-filter:backdrop-blur-md"
        className="gap-0 overflow-hidden rounded-[1.25rem] border border-line-strong bg-panel p-0 ring-0 sm:max-w-[26rem]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <form onSubmit={submit} noValidate>
          <div className="px-5 pt-5 pb-4">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
            >
              <Icon icon={SquareLock02Icon} className="size-5" />
            </span>
            <DialogTitle className="mt-4 text-[17px] font-[650] tracking-[-0.02em]">Unlock your statement</DialogTitle>
            <DialogDescription className="mt-1.5 text-[13.5px] leading-relaxed text-t3">
              Your bank locked this PDF with a password. Enter it so SpendLens can read the transactions.
            </DialogDescription>

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-panel-raised/50 px-3 py-2.5">
                <Icon icon={Pdf02Icon} className="size-5 text-t3" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{file.name}</span>
                <span className="font-mono text-[11.5px] text-t4 tabular-nums">{fileSize(file.size)}</span>
              </div>
            )}

            <label htmlFor={INPUT_ID} className="mt-5 block text-[13px] font-medium text-t2">
              Statement password
            </label>
            <div
              key={shake}
              className="relative mt-1.5"
              style={shake ? { animation: "field-shake 320ms ease-in-out" } : undefined}
            >
              <input
                ref={inputRef}
                id={INPUT_ID}
                type={visible ? "text" : "password"}
                value={password}
                disabled={busy}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={Boolean(shown)}
                aria-describedby={shown ? ERROR_ID : HINT_ID}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError(null);
                }}
                className={cn(
                  "h-11 w-full rounded-xl border bg-panel pr-11 pl-3.5 font-mono text-[14px] tracking-wide transition-colors outline-none focus-visible:outline-none disabled:opacity-60",
                  shown
                    ? "border-destructive focus:ring-3 focus:ring-destructive/20"
                    : "border-line-strong focus:border-brand focus:ring-3 focus:ring-brand/20",
                )}
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-t3 hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <Icon icon={visible ? ViewOffSlashIcon : ViewIcon} className="size-4.5" />
              </button>
            </div>
            {shown ? (
              <FieldError id={ERROR_ID}>{shown}</FieldError>
            ) : (
              <p id={HINT_ID} className="mt-1.5 text-[12.5px] leading-snug text-t4">
                Banks often use your date of birth or the last digits of your account number.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line bg-panel-raised/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Spinner />}
                {busy ? "Unlocking…" : "Unlock"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
