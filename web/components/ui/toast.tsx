"use client";

import { Toaster as Sonner, toast as sonner } from "sonner";
import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  WifiDisconnected02Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/utils/cn";
import { Icon, type IconSvgElement } from "./icon";

export type ToastTone = "danger" | "warn" | "positive" | "info";

export type ToastAction = { label: string; onClick: () => void };

export type ToastInput = {
  title: string;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** Up to two actions, shown as quiet text buttons. */
  actions?: ToastAction[];
  /** A short code shown in mono under the message, e.g. "HTTP 415". */
  code?: string;
  icon?: IconSvgElement;
  /** Milliseconds. Errors stay longer than successes. */
  duration?: number;
  id?: string;
};

const DEFAULT_DURATION: Record<ToastTone, number> = {
  danger: 8_000,
  warn: 7_000,
  positive: 4_000,
  info: 5_000,
};

const toneText: Record<ToastTone, string> = {
  danger: "text-destructive",
  warn: "text-warn",
  positive: "text-positive",
  info: "text-brand",
};

const toneTile: Record<ToastTone, string> = {
  danger: "bg-destructive/10",
  warn: "bg-warn/10",
  positive: "bg-positive/10",
  info: "bg-brand/10",
};

const toneRule: Record<ToastTone, string> = {
  danger: "bg-destructive",
  warn: "bg-warn",
  positive: "bg-positive",
  info: "bg-brand",
};

const toneIcon: Record<ToastTone, IconSvgElement> = {
  danger: Alert02Icon,
  warn: WifiDisconnected02Icon,
  positive: CheckmarkCircle02Icon,
  info: InformationCircleIcon,
};

function ToastCard({ id, input, duration }: { id: string | number; input: ToastInput; duration: number }) {
  const tone = input.tone ?? "info";
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="group relative w-[var(--width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line-strong bg-panel text-foreground shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)]"
    >
      <div className="flex gap-3 p-3.5 pr-10">
        <span
          aria-hidden="true"
          className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg", toneTile[tone], toneText[tone])}
        >
          <Icon icon={input.icon ?? toneIcon[tone]} className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[13.5px] leading-snug font-semibold tracking-[-0.01em]">{input.title}</p>
          {input.description && <div className="mt-0.5 text-[13px] leading-relaxed text-t3">{input.description}</div>}
          {(input.actions?.length || input.code) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {input.actions?.slice(0, 2).map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    sonner.dismiss(id);
                    a.onClick();
                  }}
                  className="text-[13px] font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {a.label}
                </button>
              ))}
              {input.code && <span className="ml-auto font-mono text-[11px] text-t4 tabular-nums">{input.code}</span>}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => sonner.dismiss(id)}
        className="absolute top-2.5 right-2.5 inline-flex size-7 items-center justify-center rounded-lg text-t4 hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <Icon icon={Cancel01Icon} className="size-3.5" />
      </button>

      {/* Time left, as a hairline that drains. Pauses while hovered, like the toast itself. */}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-line">
        <span
          className={cn(
            "block h-full origin-left group-hover:[animation-play-state:paused] motion-reduce:hidden",
            toneRule[tone],
          )}
          style={{ animation: `toast-drain ${duration}ms linear forwards` }}
        />
      </span>
    </div>
  );
}

/** Show a SpendLens toast. Returns its id. */
export function showToast(input: ToastInput) {
  const duration = input.duration ?? DEFAULT_DURATION[input.tone ?? "info"];
  return sonner.custom((id) => <ToastCard id={id} input={input} duration={duration} />, {
    id: input.id,
    duration,
  });
}

export const dismissToast = (id?: string | number) => sonner.dismiss(id);

/** Mount once, in the root layout. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      gap={10}
      visibleToasts={4}
      offset={20}
      mobileOffset={16}
      toastOptions={{ unstyled: true, className: "!bg-transparent !border-0 !shadow-none !p-0" }}
    />
  );
}
