import type { Metadata } from "next";
import { Suspense } from "react";

import { ProScreen } from "@/components/insights/pro/pro-screen";
import { ProSkeleton } from "@/components/insights/skeletons";

export const metadata: Metadata = { title: "Pro" };

export default function Page() {
  return (
    <Suspense fallback={<ProSkeleton />}>
      <ProScreen />
    </Suspense>
  );
}
