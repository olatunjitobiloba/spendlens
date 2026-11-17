"use client";

import { useState } from "react";
import { FloppyDiskIcon, Tick02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { showToast } from "@/components/ui/toast";
import { saveScenario } from "@/lib/plan";
import type { Scenario } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatMonth } from "@/utils/format";

/**
 * Saves the scenario in this browser (the API has no scenario routes).
 * A compact name field plus button, sized for the result dialog's footer.
 * Confirmation is a toast; the button turns into a quiet "Saved" state.
 */
export function SaveScenario({ scenario }: { scenario: Scenario }) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const fallbackName = `Plan for ${formatMonth(scenario.range.start.slice(0, 7))}`;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim() || fallbackName;
    saveScenario(scenario, clean);
    setSaved(true);
    showToast({ tone: "positive", title: "Scenario saved", description: `“${clean}” is in Saved scenarios on the Plan page.` });
  }

  return (
    <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={save}>
      <label htmlFor="scenario-name" className="sr-only">
        Name this scenario
      </label>
      <input
        id="scenario-name"
        value={name}
        maxLength={60}
        disabled={saved}
        onChange={(e) => setName(e.target.value)}
        placeholder={fallbackName}
        className="h-9 min-w-0 flex-1 rounded-full border border-line-strong bg-panel px-3.5 text-[13px] placeholder:text-t4 focus-visible:border-brand focus-visible:outline-none disabled:opacity-60 sm:max-w-56"
      />
      <Button type="submit" variant="outline" disabled={saved} className={cn(saved && "text-brand disabled:opacity-100")}>
        <Icon icon={saved ? Tick02Icon : FloppyDiskIcon} />
        {saved ? "Saved" : "Save"}
      </Button>
    </form>
  );
}
