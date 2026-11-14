import { TooltipProvider } from "@/components/ui/tooltip";
import { MeProvider } from "@/providers/me-provider";
import { InsightsMain } from "./insights-main";
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
            <InsightsMain>{children}</InsightsMain>
          </div>
        </div>
      </TooltipProvider>
    </MeProvider>
  );
}
