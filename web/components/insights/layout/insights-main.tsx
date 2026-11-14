"use client";

import { usePathname } from "next/navigation";

import { ServerWakeBanner } from "../shared/server-wake-banner";

/** Routes that own the whole content area, edge to edge, instead of the padded column. */
const FULL_BLEED = ["/insights/chat"];

export function InsightsMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (FULL_BLEED.some((p) => pathname.startsWith(p))) {
    return (
      <main id="insights-main" className="flex h-[calc(100dvh-3.5rem)] min-w-0 flex-col lg:h-dvh">
        <div className="px-4 sm:px-6 [&:has([role=status]>*)]:pt-4">
          <ServerWakeBanner />
        </div>
        <div className="flex min-h-0 flex-1">{children}</div>
      </main>
    );
  }

  return (
    <main id="insights-main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-8">
      <ServerWakeBanner />
      {children}
    </main>
  );
}
