import {
  AiChat02Icon,
  Analytics01Icon,
  ChartLineData01Icon,
  Crown02Icon,
  FileImportIcon,
  Task01Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type NavItem = { href: string; label: string; icon: IconSvgElement; pro?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

/** Sidebar of the embedded SpendLens module (technical doc §3). */
export const insightsNav: NavGroup[] = [
  {
    label: "Insights",
    items: [
      { href: "/insights", label: "Overview", icon: Analytics01Icon },
      { href: "/insights/import", label: "Import", icon: FileImportIcon },
      { href: "/insights/review", label: "Review", icon: Task01Icon },
      { href: "/insights/plan", label: "Plan", icon: Target02Icon },
      { href: "/insights/chat", label: "AI chat", icon: AiChat02Icon },
    ],
  },
  {
    label: "Pro",
    items: [
      { href: "/insights/forecast", label: "Forecast", icon: ChartLineData01Icon, pro: true },
      { href: "/insights/pro", label: "Plans and billing", icon: Crown02Icon },
    ],
  },
];

export type GetStartedStep = { id: "import" | "review" | "protect" | "cut"; label: string; href: string };

/** The demo path a judge should walk (PRD §2): import, review, protect, test a cut. */
export const getStartedSteps: GetStartedStep[] = [
  { id: "import", label: "Import transactions", href: "/insights/import?sample=1" },
  { id: "review", label: "Review flagged items", href: "/insights/review" },
  { id: "protect", label: "Protect your essentials", href: "/insights/plan" },
  { id: "cut", label: "Test a savings cut", href: "/insights/plan" },
];

/** Browser storage keys owned by the module, cleared on sign-out. */
export const STORAGE_PREFIX = "spendlens:";
export const SIDEBAR_COLLAPSED_KEY = `${STORAGE_PREFIX}sidebar-collapsed`;
export const GET_STARTED_DISMISSED_KEY = `${STORAGE_PREFIX}get-started-dismissed`;
export const TESTED_CUT_KEY = `${STORAGE_PREFIX}tested-cut`;
export const SET_PROTECTIONS_KEY = `${STORAGE_PREFIX}set-protections`;
export const CHATS_KEY = `${STORAGE_PREFIX}chats:v1`;
