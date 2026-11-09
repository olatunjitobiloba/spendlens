import type { Metadata } from "next";
import { Suspense } from "react";

import { ForecastScreen } from "@/components/insights/forecast/forecast-screen";
import { LoadingBlock } from "@/components/ui/loading";

export const metadata: Metadata = { title: "Forecast" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading forecast" />}>
      <ForecastScreen />
    </Suspense>
  );
}
