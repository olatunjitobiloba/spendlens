"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "radix-ui";

import { Icon } from "@/components/ui/icon";
import { insightsNav, type NavItem } from "@/configs/insights";
import { cn } from "@/utils/cn";

function isActive(pathname: string, href: string) {
  return href === "/insights" ? pathname === "/insights" : pathname.startsWith(href);
}

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
        active ? "bg-foreground/[0.07] text-foreground" : "text-t3 hover:bg-foreground/4 hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon icon={item.icon} className="size-4.5" />
      <span className={cn("flex-1 truncate", collapsed && "sr-only")}>{item.label}</span>
      {item.pro && !collapsed && (
        <span className="rounded-md bg-brand/12 px-1.5 py-0.5 text-[10px] font-[650] tracking-wide text-brand">PRO</span>
      )}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={10}
          className="z-50 rounded-md border border-line-strong bg-panel px-2 py-1 text-[12px] font-medium shadow-lg"
        >
          {item.label}
          {item.pro ? " · Pro" : ""}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Money Insights" className="space-y-5">
      {insightsNav.map((group) => (
        <div key={group.label}>
          <p
            className={cn(
              "mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-t4 uppercase",
              collapsed && "sr-only",
            )}
          >
            {group.label}
          </p>
          {collapsed && <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-line first:hidden" />}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
