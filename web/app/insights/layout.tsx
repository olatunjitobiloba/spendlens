import type { Metadata } from "next";

import { InsightsShell } from "@/components/insights/layout/insights-shell";

export const metadata: Metadata = {
  title: { default: "Money Insights", template: "%s · Money Insights" },
  robots: { index: false, follow: false },
};

export default function InsightsLayout({ children }: LayoutProps<"/insights">) {
  return <InsightsShell>{children}</InsightsShell>;
}
