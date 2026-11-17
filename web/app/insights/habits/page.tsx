import type { Metadata } from "next";
import { Suspense } from "react";

import { HabitsScreen } from "@/components/insights/habits/habits-screen";

export const metadata: Metadata = { title: "Habits & Emotional Spend" };

export default function HabitsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5 animate-pulse">
          <div className="h-10 w-64 rounded-lg bg-foreground/5" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-32 rounded-2xl bg-foreground/5" />
            <div className="h-32 rounded-2xl bg-foreground/5" />
            <div className="h-32 rounded-2xl bg-foreground/5" />
          </div>
          <div className="h-64 rounded-2xl bg-foreground/5" />
        </div>
      }
    >
      <HabitsScreen />
    </Suspense>
  );
}
