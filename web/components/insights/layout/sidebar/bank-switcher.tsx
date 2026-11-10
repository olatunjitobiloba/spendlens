"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowLeft01Icon,
  Database01Icon,
  Delete02Icon,
  Logout01Icon,
  Moon02Icon,
  Sun03Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { useFixtureMode } from "@/hooks/use-fixture-mode";
import { liveApiConfigured } from "@/lib/api";
import { signOutAndClear, switchMode } from "@/lib/session";
import { cn } from "@/utils/cn";
import { DeleteDataDialog } from "../../shared/delete-data-dialog";

/** Neutral fictional host app. Not modelled on any real bank (PRD §2). */
function BankAvatar({ fixtures }: { fixtures: boolean | null }) {
  return (
    <span className="relative shrink-0">
      <span
        aria-hidden="true"
        className="inline-flex size-9 items-center justify-center rounded-xl border border-line-strong bg-panel-raised text-[11.5px] font-[700] tracking-[-0.02em]"
      >
        PB
      </span>
      {fixtures !== null && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -bottom-0.5 -left-0.5 size-3 rounded-full border-2 border-background",
            fixtures ? "bg-warn" : "bg-positive",
          )}
        />
      )}
    </span>
  );
}

const item = "h-9 gap-2.5 rounded-lg px-2.5 text-[13px]";
const label = "px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-t4 uppercase";

/** Data mode, theme and account actions, folded into one menu. */
export function BankSwitcher({ collapsed }: { collapsed: boolean }) {
  const fixtures = useFixtureMode();
  const { resolvedTheme, setTheme } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = fixtures === null ? "" : fixtures ? "Sample mode" : "Live API";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Partner Bank menu${status ? `, ${status}` : ""}`}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl p-1.5 text-left outline-none hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-foreground/[0.06]",
            collapsed && "justify-center",
          )}
        >
          <BankAvatar fixtures={fixtures} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-[600]">Partner Bank</span>
                <span className="block truncate text-[12px] text-t3">{status || " "}</span>
              </span>
              <Icon icon={UnfoldMoreIcon} className="text-t3" />
            </>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={collapsed ? "right" : "top"}
          align={collapsed ? "end" : "start"}
          sideOffset={8}
          className="w-64 rounded-xl border border-line-strong p-1 shadow-2xl ring-0"
        >
          <DropdownMenuLabel className={label}>Data</DropdownMenuLabel>
          {fixtures ? (
            liveApiConfigured && (
              <DropdownMenuItem className={item} onSelect={() => switchMode(false)}>
                <Icon icon={Database01Icon} />
                Use live API
              </DropdownMenuItem>
            )
          ) : (
            <DropdownMenuItem className={item} onSelect={() => switchMode(true)}>
              <Icon icon={Database01Icon} />
              Use sample mode
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" className={item} onSelect={() => setConfirmDelete(true)}>
            <Icon icon={Delete02Icon} />
            Delete my data
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-line" />
          <DropdownMenuItem
            className={item}
            onSelect={(e) => {
              e.preventDefault(); // keep the menu open to see the change
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
          >
            <Icon icon={Moon02Icon} className="dark:hidden" />
            <Icon icon={Sun03Icon} className="hidden dark:block" />
            <span className="dark:hidden">Dark theme</span>
            <span className="hidden dark:inline">Light theme</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={item}>
            <Link href="/">
              <Icon icon={ArrowLeft01Icon} />
              About SpendLens
            </Link>
          </DropdownMenuItem>
          {fixtures === false && (
            <DropdownMenuItem className={item} onSelect={() => void signOutAndClear()}>
              <Icon icon={Logout01Icon} />
              Sign out
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteDataDialog open={confirmDelete} onOpenChange={setConfirmDelete} />
    </>
  );
}
