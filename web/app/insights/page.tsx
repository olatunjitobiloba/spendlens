import type { Metadata } from "next";
import { Suspense } from "react";

import { OverviewScreen } from "@/components/insights/overview/overview-screen";
import { OverviewSkeleton } from "@/components/insights/skeletons";

export const metadata: Metadata = { title: { absolute: "Money Insights · SpendLens" } };

export default function Page() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewScreen />
    </Suspense>
  );
}
