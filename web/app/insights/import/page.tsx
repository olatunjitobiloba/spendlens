import type { Metadata } from "next";
import { Suspense } from "react";

import { ImportScreen } from "@/components/insights/import/import-screen";
import { LoadingBlock } from "@/components/ui/loading";

export const metadata: Metadata = { title: "Import" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading import" />}>
      <ImportScreen />
    </Suspense>
  );
}
