import type { Metadata } from "next";
import { Suspense } from "react";

import { PlanScreen } from "@/components/insights/plan/plan-screen";
import { LoadingBlock } from "@/components/ui/loading";

export const metadata: Metadata = { title: "Plan" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading your plan" />}>
      <PlanScreen />
    </Suspense>
  );
}
