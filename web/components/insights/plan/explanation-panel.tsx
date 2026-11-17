import { SparklesIcon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { describeScenario } from "@/lib/plan";
import type { Scenario } from "@/types/api";

/** The result in plain words, written from the calculated numbers. */
export function ExplanationPanel({ scenario }: { scenario: Scenario }) {
  return (
    <section aria-labelledby="explain-title" className="rounded-2xl border border-line bg-panel-raised/50 p-4">
      <h3 id="explain-title" className="flex items-center gap-1.5 text-[13px] font-[600]">
        <Icon icon={SparklesIcon} className="size-3.5 text-brand" />
        In plain words
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-t2">{describeScenario(scenario)}</p>
    </section>
  );
}
