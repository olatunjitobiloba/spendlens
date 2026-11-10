import type { Metadata } from "next";
import { Suspense } from "react";

import { ReviewScreen } from "@/components/insights/review/review-screen";
import { ReviewSkeleton } from "@/components/insights/skeletons";

export const metadata: Metadata = { title: "Review" };

export default function Page() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ReviewScreen />
    </Suspense>
  );
}
