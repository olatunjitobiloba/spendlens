"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Cancel01Icon, Menu01Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons";

import { LogoMark } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { SIDEBAR_COLLAPSED_KEY } from "@/configs/insights";
import { useLocalFlag } from "@/hooks/use-local-flag";
import { cn } from "@/utils/cn";
import { PlanBadge } from "../plan-badge";
import { BankSwitcher } from "./bank-switcher";
import { GetStartedCard } from "./get-started-card";
import { SidebarNav } from "./sidebar-nav";

const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-t3 hover:bg-foreground/[0.06] hover:text-foreground";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/insights" className="flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="Money Insights overview">
      <LogoMark size={28} />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-[650] tracking-[-0.02em]">Money Insights</span>
        </span>
      )}
    </Link>
  );
}

/** Shared by the desktop rail and the mobile drawer. */
function SidebarBody({
  collapsed,
  header,
  onNavigate,
}: {
  collapsed: boolean;
  header: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-5 p-3">
      {header}
      <div className="-mx-1 flex-1 overflow-y-auto px-1 py-3">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      {!collapsed && <GetStartedCard onNavigate={onNavigate} />}
      <BankSwitcher collapsed={collapsed} />
    </div>
  );
}

/** Desktop: a sticky rail that collapses to icons. The choice is remembered per browser. */
export function DesktopSidebar() {
  const [collapsed, setCollapsed] = useLocalFlag(SIDEBAR_COLLAPSED_KEY);
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 border-r border-line bg-background transition-[width] duration-200 lg:block",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <SidebarBody
        collapsed={collapsed}
        header={
          <div className={cn("flex items-center justify-between gap-2 px-2", collapsed && "flex-col")}>
            <Brand collapsed={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className={iconButton}
            >
              <Icon icon={SidebarLeftIcon} className="size-[18px]" />
            </button>
          </div>
        }
      />
    </aside>
  );
}

/** Below lg: a top bar with a menu button that opens the sidebar as a drawer. */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-background/85 px-4 backdrop-blur-xl lg:hidden">
        <Dialog.Trigger className={iconButton} aria-label="Open menu">
          <Icon icon={Menu01Icon} className="size-5" />
        </Dialog.Trigger>
        <Brand collapsed={false} />
        <span className="ml-auto">
          <PlanBadge />
        </span>
      </header>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] border-r border-line bg-background shadow-2xl lg:hidden"
        >
          <Dialog.Title className="sr-only">Money Insights menu</Dialog.Title>
          <SidebarBody
            collapsed={false}
            onNavigate={close}
            header={
              <div className="flex items-center justify-between gap-2">
                <Brand collapsed={false} />
                <Dialog.Close className={iconButton} aria-label="Close menu">
                  <Icon icon={Cancel01Icon} className="size-[18px]" />
                </Dialog.Close>
              </div>
            }
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
