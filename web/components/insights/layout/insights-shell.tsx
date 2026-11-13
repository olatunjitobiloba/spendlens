import { TooltipProvider } from "@/components/ui/tooltip";
import { MeProvider } from "@/providers/me-provider";
import { ServerWakeBanner } from "../shared/server-wake-banner";
import { DesktopSidebar, MobileSidebar } from "./sidebar/sidebar";

/** The SpendLens module as a host app would embed it: sidebar plus content. */
export function InsightsShell({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <TooltipProvider delayDuration={200}>
        <a
          href="#insights-main"
          className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh w-full">
          <DesktopSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileSidebar />
            <main id="insights-main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-8">
              <ServerWakeBanner />
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </MeProvider>
  );
}
