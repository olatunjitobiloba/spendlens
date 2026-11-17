import type { Metadata } from "next";
import { ProScreen } from "@/components/insights/pro/pro-screen";

export const metadata: Metadata = { title: "Pro" };

export default function Page() {
  return <ProScreen />;
}
