"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TOUR_DONE_KEY } from "@/configs/insights";
import { useLocalFlag } from "@/hooks/use-local-flag";

/** Mark an element as a tour target with `data-tour={id}`. */
export type TourStep = { id: string; title: string; body: string };

/** At most six steps. Steps whose target is missing or hidden (e.g. the sidebar on mobile) are left out. */
export const OVERVIEW_TOUR: TourStep[] = [
  {
    id: "nav",
    title: "Find your way around",
    body: "Import statements, review flagged transactions, plan savings, spot habits or ask the AI chat — all from here.",
  },
  {
    id: "header",
    title: "Pick a month",
    body: "Switch the month you're looking at. You can restart this tour any time from the help button.",
  },
  {
    id: "stats",
    title: "Your month at a glance",
    body: "What you spent, what came in, how complete the data is and how many transactions still need a category.",
  },
  {
    id: "trend",
    title: "Spending by month",
    body: "See how this month compares with the months before it. Select a bar to jump to that month.",
  },
  {
    id: "cuts",
    title: "What could you cut?",
    body: "Your largest categories that aren't protected — the best places to start saving. Test a cut in Plan.",
  },
  {
    id: "categories",
    title: "Where it goes",
    body: "Every category ranked by spend, protected ones in grey. Select one to see the transactions behind it.",
  },
].slice(0, 6);

/** Closed for this visit only; it comes back next session unless skipped. */
const CANCELLED_KEY = "spendlens:tour-cancelled";
const START_EVENT = "spendlens:start-tour";

function sessionFlag(): boolean {
  try {
    return sessionStorage.getItem(CANCELLED_KEY) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag() {
  try {
    sessionStorage.setItem(CANCELLED_KEY, "1");
  } catch {
    // Storage blocked: cancelling still closes the tour for now.
  }
}

/** Opens the tour from anywhere on the page (e.g. a help button). */
export function startTour() {
  window.dispatchEvent(new Event(START_EVENT));
}

function findTarget(id: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 6;
const GAP = 12;
const CARD_W = 340;
const MARGIN = 16;

function cardPosition(rect: Rect, cardH: number): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_W, vw - MARGIN * 2);
  // Phones: dock to the bottom edge, unless the target sits there.
  if (vw < 640) {
    const atBottom = rect.top + rect.height / 2 > vh * 0.55;
    return { width, left: MARGIN, ...(atBottom ? { top: MARGIN + 56 } : { bottom: MARGIN }) };
  }
  const left = Math.min(Math.max(rect.left, MARGIN), vw - width - MARGIN);
  const below = rect.top + rect.height + PAD + GAP;
  const above = rect.top - PAD - GAP - cardH;
  // Tall target (or no room above/below): sit beside it, or float inside it.
  if (below + cardH <= vh - MARGIN) return { width, left, top: below };
  if (above >= MARGIN) return { width, left, top: above };
  const right = rect.left + rect.width + PAD + GAP;
  if (right + width <= vw - MARGIN) return { width, left: right, top: Math.max(MARGIN, Math.min(rect.top, vh - cardH - MARGIN)) };
  return { width, left, top: Math.max(MARGIN, vh - cardH - MARGIN) };
}

/**
 * A short guided tour of the dashboard. It opens by itself on the first visit,
 * can be skipped (never shown again) or cancelled (shown again next visit),
 * and restarts through `startTour()`.
 */
export function DashboardTour({ steps = OVERVIEW_TOUR }: { steps?: TourStep[] }) {
  const [done, setDone] = useLocalFlag(TOUR_DONE_KEY, true);
  const [active, setActive] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(180);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const visible = steps.filter((s) => findTarget(s.id));
    if (!visible.length) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    setIndex(0);
    setActive(visible);
  }, [steps]);

  // First visit: open once the dashboard has painted.
  useEffect(() => {
    if (done || sessionFlag()) return;
    const t = window.setTimeout(open, 400);
    return () => window.clearTimeout(t);
  }, [done, open]);

  useEffect(() => {
    window.addEventListener(START_EVENT, open);
    return () => window.removeEventListener(START_EVENT, open);
  }, [open]);

  const step = active?.[index];

  const close = useCallback(
    (how: "skip" | "cancel" | "finish") => {
      if (how === "cancel") setSessionFlag();
      else setDone(true);
      setActive(null);
      setRect(null);
      returnFocus.current?.focus?.();
    },
    [setDone],
  );

  // Bring the target into view, then follow it on scroll and resize.
  useEffect(() => {
    if (!step) return;
    const el = findTarget(step.id);
    if (!el) return;
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [step, rect]);

  useEffect(() => {
    if (step) nextRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (!active || !step) return null;

  const last = index === active.length - 1;
  const next = () => (last ? close("finish") : setIndex(index + 1));
  const back = () => setIndex(Math.max(0, index - 1));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close("cancel");
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") back();
    else if (e.key === "Tab" && cardRef.current) {
      // Keep focus inside the card while it is open.
      const items = cardRef.current.querySelectorAll<HTMLElement>("button");
      const first = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const transition = "motion-safe:transition-[top,left,width,height] motion-safe:duration-300 motion-safe:ease-out";

  return createPortal(
    <div className="fixed inset-0 z-[60]" onKeyDown={onKeyDown}>
      {/* Click-blocker; the dimming comes from the spotlight's shadow. */}
      <div className="absolute inset-0" aria-hidden="true" />
      {rect && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-[1.4rem] ring-2 ring-brand shadow-[0_0_0_9999px_rgb(9_9_11/0.5)] dark:shadow-[0_0_0_9999px_rgb(0_0_0/0.72)] ${transition}`}
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={`absolute rounded-2xl border border-line-strong bg-panel p-4 text-foreground shadow-[0_18px_50px_-12px_rgb(0_0_0/0.35)] ${transition} ${rect ? "" : "invisible"}`}
        style={rect ? cardPosition(rect, cardH) : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-brand uppercase">
              Step {index + 1} of {active.length}
            </p>
            <h2 id="tour-title" className="mt-1 text-[15px] font-[600] tracking-[-0.01em]">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => close("cancel")}
            aria-label="Close tour"
            className="-mt-1 -mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-t3 hover:bg-foreground/6 hover:text-foreground"
          >
            <Icon icon={Cancel01Icon} className="size-3.5" />
          </button>
        </div>
        <p id="tour-body" className="mt-1.5 text-[13px] leading-relaxed text-t3">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden="true">
            {active.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-brand" : "w-1.5 bg-foreground/15"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {!last && (
              <Button variant="ghost" size="sm" onClick={() => close("skip")}>
                Skip
              </Button>
            )}
            {index > 0 && (
              <Button variant="outline" size="icon-sm" onClick={back} aria-label="Previous step">
                <Icon icon={ArrowLeft01Icon} />
              </Button>
            )}
            <Button ref={nextRef} size="sm" onClick={next}>
              {last ? "Done" : "Next"}
              {!last && <Icon icon={ArrowRight01Icon} />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
