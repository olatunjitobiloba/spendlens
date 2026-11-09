import {
  Analytics01Icon,
  ArrowDataTransferHorizontalIcon,
  ChartLineData01Icon,
  CreditCardIcon,
  Crown02Icon,
  Home01Icon,
  Task01Icon,
  Target02Icon,
  Upload04Icon,
  Wallet01Icon,
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
      { href: "/insights/import", label: "Import", icon: Upload04Icon },
      { href: "/insights/review", label: "Review", icon: Task01Icon },
      { href: "/insights/plan", label: "Plan", icon: Target02Icon },
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

/** The fictional host app's own sections. Listed, not linked: they are not part of the demo. */
export const hostNav: { label: string; icon: IconSvgElement }[] = [
  { label: "Home", icon: Home01Icon },
  { label: "Accounts", icon: Wallet01Icon },
  { label: "Payments", icon: ArrowDataTransferHorizontalIcon },
  { label: "Cards", icon: CreditCardIcon },
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
