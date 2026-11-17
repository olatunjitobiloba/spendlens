import type { Metadata } from "next";

import { HabitsScreen } from "@/components/insights/habits/habits-screen";

export const metadata: Metadata = { title: "Habits and subscriptions" };

export default function Page() {
  return <HabitsScreen />;
}
