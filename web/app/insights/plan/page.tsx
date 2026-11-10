import type { Metadata } from "next";
import { Suspense } from "react";

import { PlanScreen } from "@/components/insights/plan/plan-screen";
import { PlanSkeleton } from "@/components/insights/skeletons";

export const metadata: Metadata = { title: "Plan" };

export default function Page() {
  return (
    <Suspense fallback={<PlanSkeleton />}>
      <PlanScreen />
    </Suspense>
  );
}
