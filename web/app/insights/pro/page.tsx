import type { Metadata } from "next";
import { Suspense } from "react";

import { ProScreen } from "@/components/insights/pro/pro-screen";
import { LoadingBlock } from "@/components/ui/loading";

export const metadata: Metadata = { title: "Pro" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Checking your plan" />}>
      <ProScreen />
    </Suspense>
  );
}
