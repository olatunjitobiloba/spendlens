"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { insightsTabs } from "@/configs/insights";
import { cn } from "@/utils/cn";

export function ModuleTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Money Insights" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {insightsTabs.map((tab) => {
          const active = tab.href === "/insights" ? pathname === "/insights" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px inline-flex h-11 items-center gap-1.5 rounded-t-lg border-b-2 px-3 text-[13.5px] font-medium transition-colors",
                  active ? "border-foreground text-foreground" : "border-transparent text-t3 hover:text-foreground",
                )}
              >
                <Icon icon={tab.icon} className="size-[15px]" />
                {tab.label}
                {tab.pro && <span className="text-[10.5px] font-[600] text-brand">PRO</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
