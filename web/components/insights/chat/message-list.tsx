"use client";

import { useEffect, useRef } from "react";
import { AiChat02Icon, ArrowRight01Icon, Mic01Icon, VolumeHighIcon, VolumeMute01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import type { ChatMessage } from "@/hooks/use-chats";
import { formatDuration } from "@/hooks/use-voice-recorder";
import { cn } from "@/utils/cn";

export type Pending = { kind: "transcribing"; seconds: number } | { kind: "thinking" } | null;
export type ThreadError = { message: string; canRetry: boolean } | null;

const SUGGESTIONS = [
  "Where did most of my money go this month?",
  "How much did I spend in total?",
  "How much money came in this month?",
  "Which categories are protected?",
];

function Avatar() {
  return (
    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-panel-raised text-brand">
      <Icon icon={AiChat02Icon} className="size-3.5" />
    </span>
  );
}

function VoiceTag({ seconds }: { seconds: number }) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-[11.5px] text-t3">
      <Icon icon={Mic01Icon} className="size-3" />
      Voice note · {formatDuration(seconds)}
    </span>
  );
}

function Message({
  message,
  onSpeak,
  isSpeaking,
}: {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-[1.25rem] bg-foreground/[0.06] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-foreground">
          {message.voiceSeconds != null && <VoiceTag seconds={message.voiceSeconds} />}
          {message.text}
        </div>
      </li>
    );
  }
  return (
    <li className="group flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "pt-1 text-[14px] leading-relaxed whitespace-pre-wrap",
            message.refusal ? "text-t3" : "text-t2",
          )}
        >
          {message.text}
        </p>
        {onSpeak && (
          <button
            type="button"
            onClick={() => onSpeak(message.text)}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium text-t3 hover:bg-foreground/[0.04] hover:text-foreground transition-colors"
            aria-label={isSpeaking ? "Stop speaking" : "Listen to answer"}
          >
            <Icon icon={isSpeaking ? VolumeMute01Icon : VolumeHighIcon} className="size-3 text-brand" />
            <span>{isSpeaking ? "Stop" : "Listen"}</span>
          </button>
        )}
      </div>
    </li>
  );
}

function Thinking() {
  return (
    <li className="flex gap-3" aria-label="Writing a reply">
      <Avatar />
      <span className="flex h-7 items-center gap-1" aria-hidden="true">
        {[0, 160, 320].map((d) => (
          <span
            key={d}
            className="size-1.5 animate-pulse rounded-full bg-t4 motion-reduce:animate-none"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </span>
    </li>
  );
}

export function EmptyThread({ onAsk }: { onAsk: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-panel-raised text-brand">
        <Icon icon={AiChat02Icon} className="size-5" />
      </span>
      <h2 className="mt-4 text-[20px] font-[650] tracking-[-0.03em]">Ask about your money</h2>
      <p className="mt-1 text-[13.5px] text-t3">
        Answers come from your imported transactions. Type a question or record a voice note.
      </p>
      <ul className="mt-6 w-full divide-y divide-line overflow-hidden rounded-2xl border border-line text-left">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onAsk(s)}
              className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-[13.5px] text-t2 transition-colors hover:bg-foreground/[0.03] hover:text-foreground"
            >
              {s}
              <Icon
                icon={ArrowRight01Icon}
                className="size-4 text-t4 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MessageList({
  messages,
  pending,
  error,
  onRetry,
  onSpeak,
  speakingText,
}: {
  messages: ChatMessage[];
  pending: Pending;
  error: ThreadError;
  onRetry: () => void;
  onSpeak?: (text: string) => void;
  speakingText?: string | null;
}) {
  const end = useRef<HTMLDivElement>(null);
  const count = messages.length;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [count, pending, error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-4 sm:px-6">
      <ol className="space-y-6" aria-live="polite" aria-relevant="additions">
        {messages.map((m) => (
          <Message
            key={m.id}
            message={m}
            onSpeak={onSpeak}
            isSpeaking={speakingText === m.text}
          />
        ))}
        {pending?.kind === "transcribing" && (
          <li className="flex justify-end">
            <div className="rounded-[1.25rem] bg-foreground/[0.06] px-4 py-2.5 text-[14px]">
              <VoiceTag seconds={pending.seconds} />
              <span className="flex items-center gap-2 text-t3">
                <Spinner className="size-3.5" />
                Transcribing…
              </span>
            </div>
          </li>
        )}
        {pending?.kind === "thinking" && <Thinking />}
        {error && (
          <li className="flex gap-3">
            <Avatar />
            <p className="pt-1 text-[13.5px] text-t3">
              {error.message}{" "}
              {error.canRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-medium text-foreground underline decoration-line-strong underline-offset-4 hover:decoration-foreground"
                >
                  Try again
                </button>
              )}
            </p>
          </li>
        )}
      </ol>
      <div ref={end} />
    </div>
  );
}
