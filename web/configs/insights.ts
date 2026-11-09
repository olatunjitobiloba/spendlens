import {
  Analytics01Icon,
  ChartLineData01Icon,
  Crown02Icon,
  Task01Icon,
  Target02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type InsightsTab = { href: string; label: string; icon: IconSvgElement; pro?: boolean };

/** Tabs inside the embedded SpendLens module (technical doc §3). */
export const insightsTabs: InsightsTab[] = [
  { href: "/insights", label: "Overview", icon: Analytics01Icon },
  { href: "/insights/import", label: "Import", icon: Upload04Icon },
  { href: "/insights/review", label: "Review", icon: Task01Icon },
  { href: "/insights/plan", label: "Plan", icon: Target02Icon },
  { href: "/insights/forecast", label: "Forecast", icon: ChartLineData01Icon, pro: true },
  { href: "/insights/pro", label: "Pro", icon: Crown02Icon },
];

/** The fictional host app's own sections. Shown, not linked: they are not part of the demo. */
export const hostNav = ["Home", "Accounts", "Payments", "Cards"] as const;

/** Browser storage keys owned by the module, cleared on sign-out. */
export const STORAGE_PREFIX = "spendlens:";
