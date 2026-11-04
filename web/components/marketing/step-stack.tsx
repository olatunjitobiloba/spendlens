"use client";

import { useEffect, useRef } from "react";

/**
 * Sets a --depth CSS variable on each [data-step-card] so cards that are
 * covered by later cards shrink slightly. Only runs when the cards are sticky
 * (md and up) and the user has not asked for reduced motion.
 */
export function StepStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const wide = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-step-card]"));
      if (!wide.matches || calm.matches) {
        cards.forEach((c) => c.style.removeProperty("--depth"));
        return;
      }
      const rects = cards.map((c) => c.getBoundingClientRect());
      rects.forEach((r, i) => {
        let depth = 0;
        for (let j = i + 1; j < rects.length; j++) {
          const covered = (r.bottom - rects[j].top) / r.height;
          depth += Math.min(Math.max(covered, 0), 1);
        }
        cards[i].style.setProperty("--depth", depth.toFixed(3));
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    wide.addEventListener("change", schedule);
    calm.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      wide.removeEventListener("change", schedule);
      calm.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <ol ref={ref} className="relative mt-10 flex flex-col gap-4 sm:mt-14 md:gap-0">
      {children}
    </ol>
  );
}
