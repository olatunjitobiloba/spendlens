"use client";

import { Switch } from "radix-ui";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { UNCATEGORISED } from "@/configs/categories";
import { SET_PROTECTIONS_KEY } from "@/configs/insights";
import { setLocalFlag } from "@/hooks/use-local-flag";
import { setProtected } from "@/lib/plan";
import type { Analysis } from "@/types/api";

/** Essentials toggles. Kept in this browser; the API has no protections route. */
export function Protections({ analysis }: { analysis: Analysis }) {
  const cats = analysis.categories.filter((c) => c.category !== UNCATEGORISED);

  function toggle(category: string, on: boolean) {
    setProtected(category, on);
    setLocalFlag(SET_PROTECTIONS_KEY, true);
  }

  return (
    <Section title="Protect essentials" description="Protected categories are never cut. Rent and bills are a good start.">
      <ul className="divide-y divide-line">
        {cats.map((c) => {
          const id = `protect-${c.category.replace(/\W+/g, "-")}`;
          return (
            <li key={c.category} className="flex items-center justify-between gap-3 py-2.5">
              <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                <span className="flex items-center gap-1.5 text-[13.5px]">
                  {c.category}
                  {c.protected && <Icon icon={SquareLock02Icon} className="size-3.5 text-t3" />}
                </span>
                <Money kobo={c.total_kobo} className="text-[12px] text-t3" />
              </label>
              <span className="flex items-center gap-2">
                <span className="w-16 text-right text-[12px] text-t3">{c.protected ? "Protected" : "Flexible"}</span>
                <Switch.Root
                  id={id}
                  checked={c.protected}
                  onCheckedChange={(on) => toggle(c.category, on)}
                  className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-foreground/15 transition-colors disabled:opacity-50 data-[state=checked]:bg-foreground"
                >
                  <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-panel shadow transition-transform data-[state=checked]:translate-x-[18px]" />
                </Switch.Root>
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
