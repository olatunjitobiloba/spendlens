import type { Metadata } from "next";
import { Suspense } from "react";

import { ReviewScreen } from "@/components/insights/review/review-screen";
import { LoadingBlock } from "@/components/ui/loading";

export const metadata: Metadata = { title: "Review" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading your transactions" />}>
      <ReviewScreen />
    </Suspense>
  );
}
