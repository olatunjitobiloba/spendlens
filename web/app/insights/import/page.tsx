import type { Metadata } from "next";
import { Suspense } from "react";

import { ImportScreen } from "@/components/insights/import/import-screen";
import { ImportSkeleton } from "@/components/insights/skeletons";

export const metadata: Metadata = { title: "Import" };

export default function Page() {
  return (
    <Suspense fallback={<ImportSkeleton />}>
      <ImportScreen />
    </Suspense>
  );
}
