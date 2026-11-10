import type { Metadata } from "next";
import { Suspense } from "react";

import { ForecastScreen } from "@/components/insights/forecast/forecast-screen";
import { ForecastSkeleton } from "@/components/insights/skeletons";

export const metadata: Metadata = { title: "Forecast" };

export default function Page() {
  return (
    <Suspense fallback={<ForecastSkeleton />}>
      <ForecastScreen />
    </Suspense>
  );
}
