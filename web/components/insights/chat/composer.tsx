"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp02Icon, Cancel01Icon, Mic01Icon, StopIcon } from "@hugeicons/core-free-icons";

import { Hint } from "@/components/ui/hint";
import { Icon } from "@/components/ui/icon";
import { formatDuration, useVoiceRecorder, type VoiceNote } from "@/hooks/use-voice-recorder";
import { cn } from "@/utils/cn";

const MAX_CHARS = 500; // ai/api.py ChatIn.message

const roundButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,opacity] duration-150 disabled:pointer-events-none";
const quietButton = cn(roundButton, "text-t3 hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-40");
const solidButton = cn(roundButton, "bg-foreground text-background hover:bg-foreground/85 disabled:opacity-25");

export function Composer({
  busy,
  onSend,
  onVoice,
  onStop,
}: {
  busy: boolean;
  onSend: (text: string) => void;
  onVoice: (note: VoiceNote) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const recorder = useVoiceRecorder({ onAutoStop: (note) => note && onVoice(note) });
  const recording = recorder.status !== "idle";
  const canSend = text.trim().length > 0 && !busy;

  // Grow with the text up to a few lines, then scroll.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text, recording]);

  useEffect(() => {
    if (!busy && !recording) input.current?.focus({ preventScroll: true });
  }, [busy, recording]);

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  async function finishRecording() {
    const note = await recorder.stop();
    if (note) onVoice(note);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-4 sm:px-6 sm:pb-5">
      <div
        className={cn(
          "rounded-[1.5rem] border bg-panel transition-colors",
          recording ? "border-foreground/20" : "border-line-strong focus-within:border-foreground/25",
        )}
      >
        {recording ? (
          <div
            className="flex h-[5.75rem] items-center gap-3 px-2"
            onKeyDown={(e) => {
              if (e.key === "Escape") recorder.cancel();
            }}
          >
            <Hint label="Discard">
              <button type="button" onClick={recorder.cancel} aria-label="Discard voice note" className={quietButton}>
                <Icon icon={Cancel01Icon} className="size-4.5" />
              </button>
            </Hint>
            <span className="flex items-center gap-2 text-[13px] text-t2 tabular-nums">
              <span className="size-2 animate-pulse rounded-full bg-destructive motion-reduce:animate-none" />
              {formatDuration(recorder.seconds)}
            </span>
            <span className="flex h-8 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden" aria-hidden="true">
              {recorder.levels.map((l, i) => (
                <span
                  key={i}
                  className="w-[3px] shrink-0 rounded-full bg-foreground/55 transition-[height] duration-75"
                  style={{ height: `${Math.max(3, Math.round(l * 30))}px` }}
                />
              ))}
            </span>
            <span className="sr-only" role="status">
              Recording. {recorder.maxSeconds - recorder.seconds} seconds left.
            </span>
            <Hint label="Send voice note">
              <button
                type="button"
                onClick={finishRecording}
                disabled={recorder.status !== "recording"}
                aria-label="Send voice note"
                autoFocus
                className={solidButton}
              >
                <Icon icon={ArrowUp02Icon} className="size-4.5" />
              </button>
            </Hint>
          </div>
        ) : (
          <>
            <label htmlFor="chat-input" className="sr-only">
              Ask about your spending
            </label>
            <textarea
              id="chat-input"
              ref={input}
              rows={1}
              value={text}
              maxLength={MAX_CHARS}
              placeholder="Ask about your spending…"
              onChange={(e) => {
                setText(e.target.value);
                if (recorder.error) recorder.clearError();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[14px] leading-relaxed text-foreground placeholder:text-t4 focus-visible:outline-none"
            />
            <div className="flex items-center gap-2 px-2 pb-2">
              <p className="min-w-0 flex-1 truncate pl-2 text-[12px]" aria-live="polite">
                {recorder.error ? (
                  <span className="text-destructive">{recorder.error}</span>
                ) : text.length > MAX_CHARS - 80 ? (
                  <span className="text-t4 tabular-nums">{MAX_CHARS - text.length} characters left</span>
                ) : null}
              </p>
              {recorder.supported && (
                <Hint label="Record a voice note">
                  <button
                    type="button"
                    onClick={recorder.start}
                    disabled={busy}
                    aria-label="Record a voice note"
                    className={quietButton}
                  >
                    <Icon icon={Mic01Icon} className="size-4.5" />
                  </button>
                </Hint>
              )}
              {busy ? (
                <Hint label="Stop">
                  <button type="button" onClick={onStop} aria-label="Stop" className={solidButton}>
                    <Icon icon={StopIcon} className="size-4" />
                  </button>
                </Hint>
              ) : (
                <button type="button" onClick={submit} disabled={!canSend} aria-label="Send" className={solidButton}>
                  <Icon icon={ArrowUp02Icon} className="size-4.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-[11.5px] text-t4">
        Answers use only your imported figures and are not financial advice.
      </p>
    </div>
  );
}
