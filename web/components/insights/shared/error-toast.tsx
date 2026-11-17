"use client";

import { showToast, type ToastAction } from "@/components/ui/toast";
import { asApiError, isFixtureMode, liveModeBlocker, setFixtureOverride, type ApiError } from "@/lib/api";
import { switchMode } from "@/lib/session";

/**
 * Action failures (an import, a save, a delete) go to a toast. Each says what
 * happened and offers the next step. Field errors stay under their inputs.
 */
export function toastApiError(e: unknown, opts: { title: string; onRetry?: () => void }): ApiError {
  const error = asApiError(e);
  if (error.kind === "aborted") return error;

  const retry: ToastAction[] = opts.onRetry ? [{ label: "Try again", onClick: opts.onRetry }] : [];
  const code = error.status ? `HTTP ${error.status}` : error.kind === "asleep" ? "No response" : undefined;

  if (error.kind === "asleep") {
    const canSwitch = !isFixtureMode();
    showToast({
      tone: "warn",
      title: opts.title,
      description: "The SpendLens server is waking up or unreachable. It can take up to a minute to start.",
      code,
      actions: [
        ...retry,
        ...(canSwitch
          ? [{ label: "Use sample mode", onClick: () => (setFixtureOverride(true), window.location.reload()) }]
          : []),
      ],
    });
    return error;
  }

  if (error.kind === "unauthorized") {
    showToast({
      tone: "danger",
      title: opts.title,
      description: error.message,
      code,
      actions: [{ label: "Use sample mode", onClick: () => switchMode(true) }],
    });
    return error;
  }

  if (error.kind === "pro_required") {
    showToast({
      tone: "info",
      title: "This is part of SpendLens Pro",
      description: "Unlock it for 30 days through Kora Checkout.",
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      actions: [{ label: "See Pro", onClick: () => window.location.assign("/insights/pro") }],
    });
    return error;
  }

  // Sample mode can't read this file, but the live API might: offer the switch.
  const goLive: ToastAction[] =
    error.kind === "unsupported_file" && isFixtureMode() && !liveModeBlocker()
      ? [{ label: "Switch to live API", onClick: () => switchMode(false) }]
      : [];

  showToast({
    tone: "danger",
    title: opts.title,
    description: error.kind === "server" ? `${error.message} If it keeps happening, reload the page.` : error.message,
    code,
    actions: [...goLive, ...retry],
  });
  return error;
}
