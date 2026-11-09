import Link from "next/link";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { LogoMark } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { MeProvider } from "@/providers/me-provider";
import { DeleteDataDialog } from "../shared/delete-data-dialog";
import { HostBar } from "./host-bar";
import { ModeBanner } from "./mode-banner";
import { ModuleTabs } from "./module-tabs";
import { PlanBadge } from "./plan-badge";

/** Partner Bank host app with the SpendLens module embedded inside it. */
export function InsightsShell({ children }: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <a
        href="#insights-main"
        className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <HostBar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-10 sm:px-6 sm:pt-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} />
            <p className="text-[13px] text-t3">
              <span className="font-medium text-foreground">Money Insights</span> · powered by SpendLens
            </p>
            <PlanBadge />
          </div>
          <ModeBanner />
        </div>
        <ModuleTabs />
        <main id="insights-main" className="pt-6">
          {children}
        </main>
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-[12.5px] text-t3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1 rounded-full hover:text-foreground">
            <Icon icon={ArrowLeft01Icon} className="size-3.5" />
            About SpendLens
          </Link>
          <p>Every number comes from the API. AI only explains it. No money moves.</p>
          <DeleteDataDialog />
        </div>
      </footer>
    </MeProvider>
  );
}
