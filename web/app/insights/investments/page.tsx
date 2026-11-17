import type { Metadata } from "next";
import { Suspense } from "react";

import { InvestmentsScreen } from "@/components/insights/investments/investments-screen";

export const metadata: Metadata = { title: "Investment Opportunities" };

export default function InvestmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5 animate-pulse">
          <div className="h-10 w-64 rounded-lg bg-foreground/5" />
          <div className="h-64 rounded-2xl bg-foreground/5" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-56 rounded-2xl bg-foreground/5" />
            <div className="h-56 rounded-2xl bg-foreground/5" />
          </div>
        </div>
      }
    >
      <InvestmentsScreen />
    </Suspense>
  );
}
