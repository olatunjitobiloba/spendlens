import type { Metadata } from "next";
import { Suspense } from "react";

import { SubscriptionsScreen } from "@/components/insights/subscriptions/subscriptions-screen";

export const metadata: Metadata = { title: "Subscriptions" };

export default function SubscriptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5 animate-pulse">
          <div className="h-10 w-64 rounded-lg bg-foreground/5" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-28 rounded-2xl bg-foreground/5" />
            <div className="h-28 rounded-2xl bg-foreground/5" />
            <div className="h-28 rounded-2xl bg-foreground/5" />
          </div>
          <div className="h-48 rounded-2xl bg-foreground/5" />
        </div>
      }
    >
      <SubscriptionsScreen />
    </Suspense>
  );
}
