import type { Metadata } from "next";
import { Suspense } from "react";

import { OverviewScreen } from "@/components/insights/overview/overview-screen";
import { LoadingBlock } from "@/components/ui/loading";

export const metadata: Metadata = { title: { absolute: "Money Insights · SpendLens" } };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading your summary" />}>
      <OverviewScreen />
    </Suspense>
  );
}
