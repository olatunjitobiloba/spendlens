"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { BankApp } from "@/configs/bank-apps";
import { BEATS, stateAt } from "@/configs/integration";
import { BankAppScreen, statusColorFor, themeVars } from "./bank-app-screens";
import { PhoneFrame, type Device } from "./phone-frame";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/** True while the element is on screen and the tab is visible, so timers never run unseen. */
export function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);
  return inView && pageVisible;
}

/**
 * Steps through the beats with a single timer while `running`.
 * `onLoop` fires each time the walkthrough wraps back to the start.
 */
export function useSimPlayer(running: boolean, onLoop?: () => void) {
  const [beat, setBeat] = useState(0);
  const ms = BEATS[beat].ms;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      const last = beat === BEATS.length - 1;
      if (last) onLoop?.();
      setBeat(last ? 0 : beat + 1);
    }, ms);
    return () => window.clearTimeout(t);
  }, [beat, ms, running, onLoop]);
  return [beat, setBeat] as const;
}

function Cursor({ ref, rippleRef }: { ref: React.Ref<HTMLDivElement>; rippleRef: React.Ref<HTMLSpanElement> }) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-40 transition-transform will-change-transform"
      style={{ transform: "translate3d(150px, 360px, 0)", transitionDuration: "700ms" }}
    >
      <span ref={rippleRef} className="absolute -top-4 -left-4 size-8 rounded-full bg-black/25 opacity-0 ring-2 ring-white/70" />
      <svg width="22" height="22" viewBox="0 0 24 24" className="relative -mt-px -ml-px drop-shadow-[0_2px_3px_rgb(0_0_0/0.35)]">
        <path
          d="M3.2 2.4 20 10.1c.8.4.7 1.5-.1 1.8l-6.9 2.2-2.4 6.8c-.3.8-1.4.8-1.8.1L2 3.6c-.3-.7.5-1.5 1.2-1.2Z"
          fill="#0B0B0C"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** The phone, the bank app screen for a beat, and the cursor that walks through it. */
export function SimPhone({ device, bank, beat }: { device: Device; bank: BankApp; beat: number }) {
  const reduced = useReducedMotion();
  const screenRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const lastTap = useRef(-1);

  const current = BEATS[beat];
  const state = useMemo(() => stateAt(beat), [beat]);
  const top = device === "iphone" ? 46 : 34;

  // Move the cursor to the beat's target. Measured once per beat, then left to a CSS transform.
  useLayoutEffect(() => {
    const screen = screenRef.current;
    const cursor = cursorRef.current;
    if (!screen || !cursor || !current.target) return;
    const el = screen.querySelector<HTMLElement>(`[data-sim="${current.target}"]`);
    if (!el) return;

    // The phone may be scaled down with a CSS transform; work in unscaled pixels.
    const s = screen.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const scale = s.width / screen.offsetWidth || 1;
    const x = (r.left - s.left + r.width / 2) / scale;
    const y = (r.top - s.top + r.height / 2) / scale;
    const drag = current.set?.cut !== undefined;

    cursor.style.transitionDuration = drag ? "1300ms" : "700ms";
    cursor.style.transitionTimingFunction = drag ? "cubic-bezier(0.45,0,0.2,1)" : "cubic-bezier(0.22,1,0.36,1)";
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (current.tap && lastTap.current !== beat && !reduced) {
      rippleRef.current?.animate(
        [
          { transform: "scale(0.4)", opacity: 0.9 },
          { transform: "scale(1.5)", opacity: 0 },
        ],
        { duration: 420, easing: "ease-out" },
      );
      el.animate([{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }], { duration: 260 });
    }
    lastTap.current = current.tap ? beat : -1;
  }, [beat, current, bank.slug, device, reduced]);

  return (
    <PhoneFrame
      device={device}
      statusColor={statusColorFor(bank, current.screen)}
      indicatorColor={bank.layout === "dark" ? "#FFFFFF" : "#0B0B0C"}
    >
      <div ref={screenRef} className="absolute inset-0 select-none" style={themeVars(bank)}>
        <div key={current.screen} className="absolute inset-0 animate-in duration-300 fade-in">
          <BankAppScreen bank={bank} screen={current.screen} state={state} top={top} />
        </div>
        <Cursor ref={cursorRef} rippleRef={rippleRef} />
      </div>
    </PhoneFrame>
  );
}
