import type { Metadata } from "next";
import { Suspense } from "react";

import { HabitsScreen } from "@/components/insights/habits/habits-screen";

export const metadata: Metadata = { title: "Habits and subscriptions" };

export default function Page() {
  // The screen reads ?tab= with useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <HabitsScreen />
    </Suspense>
  );
}
