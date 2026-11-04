"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-panel text-t3 transition-colors duration-150 hover:border-line-strong hover:text-foreground"
    >
      {/* Both icons render; CSS picks one so server and client markup match. */}
      <HugeiconsIcon icon={Moon02Icon} className="size-4 dark:hidden" strokeWidth={1.8} />
      <HugeiconsIcon icon={Sun03Icon} className="hidden size-4 dark:block" strokeWidth={1.8} />
    </button>
  );
}
