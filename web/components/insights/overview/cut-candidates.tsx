import Link from "next/link";
import { ArrowRight01Icon, Scissor01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { UNCATEGORISED } from "@/configs/categories";
import type { Analysis } from "@/types/api";

/** The one decision the screen exists for: what can I cut? (PRD §10) */
export function CutCandidates({ analysis, month }: { analysis: Analysis | null; month: string }) {
  // The API already sorts categories by total; we only filter.
  const flexible = (analysis?.categories ?? [])
    .filter((c) => !c.protected && c.category !== UNCATEGORISED)
    .slice(0, 4);

  return (
    <Section title="What could you cut?" description="Largest categories that aren't protected" className="flex flex-col">
      {!analysis || flexible.length === 0 ? (
        <EmptyState icon={Scissor01Icon} title={analysis ? "Everything is protected" : "Nothing to cut yet"} className="flex-1">
          {analysis
            ? "Unprotect a category on the Plan screen to test a cut."
            : "Your biggest flexible categories appear once transactions arrive."}
        </EmptyState>
      ) : (
        <>
          <ol className="space-y-1.5">
            {flexible.map((c, i) => (
              <li key={c.category} className="flex items-center gap-3 rounded-xl bg-panel-raised/60 px-3 py-2.5">
                <span className="w-3 font-mono text-[12px] text-t4">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{c.category}</span>
                <Money kobo={c.total_kobo} className="text-[13px] text-t2" />
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-4">
            <Button asChild className="w-full">
              <Link href={`/insights/plan?month=${month}`}>
                Test a savings cut
                <Icon icon={ArrowRight01Icon} />
              </Link>
            </Button>
          </div>
        </>
      )}
    </Section>
  );
}
