"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { Hint } from "@/components/ui/hint";
import { Icon } from "@/components/ui/icon";
import {
  GET_STARTED_DISMISSED_KEY,
  SET_PROTECTIONS_KEY,
  TESTED_CUT_KEY,
  getStartedSteps,
  type GetStartedStep,
} from "@/configs/insights";
import { useLocalFlag } from "@/hooks/use-local-flag";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";

/** The four-step demo path, so a first-time visitor knows what to do next. */
export function GetStartedCard({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useLocalFlag(GET_STARTED_DISMISSED_KEY);
  const [protectedSet] = useLocalFlag(SET_PROTECTIONS_KEY);
  const [testedCut] = useLocalFlag(TESTED_CUT_KEY);
  // Refetch on each navigation so the checklist follows what the user just did.
  const analysis = useResource(() => api.analysis(), `get-started|${pathname}`, !dismissed);

  if (dismissed || !analysis.data) return null;
  const a = analysis.data;
  const imported = a.imports.length > 0;
  const done: Record<GetStartedStep["id"], boolean> = {
    import: imported,
    review: imported && a.needs_review_count === 0 && a.reconciliation_candidates.length === 0,
    protect: imported && protectedSet,
    cut: imported && testedCut,
  };
  const count = getStartedSteps.filter((s) => done[s.id]).length;
  const next = getStartedSteps.find((s) => !done[s.id]);

  return (
    <section aria-labelledby="get-started-title" className="rounded-2xl border border-line bg-panel p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="get-started-title" className="text-[14px] font-[600]">
            {next ? "Get started" : "You're all set"}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-t3">
            {count} of {getStartedSteps.length} done
          </p>
        </div>
        <Hint label="Hide checklist">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Hide the get started checklist"
            className="-mt-1 -mr-1 inline-flex size-7 items-center justify-center rounded-lg text-t3 hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <Icon icon={Cancel01Icon} className="size-3.5" />
          </button>
        </Hint>
      </div>

      <div
        role="progressbar"
        aria-label="Get started progress"
        aria-valuemin={0}
        aria-valuemax={getStartedSteps.length}
        aria-valuenow={count}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]"
      >
        <div
          className="h-full rounded-full bg-positive transition-[width] duration-300"
          style={{ width: `${(count / getStartedSteps.length) * 100}%` }}
        />
      </div>

      {next && (
        <Link
          href={next.href}
          onClick={onNavigate}
          className="-mx-1 mt-3 flex items-center justify-between gap-2 rounded-lg border-t border-line px-1 pt-3 text-[13px] text-t2 hover:text-foreground"
        >
          <span className="truncate">Next: {next.label}</span>
          <Icon icon={ArrowRight01Icon} className="size-3.5 text-t3" />
        </Link>
      )}
    </section>
  );
}
