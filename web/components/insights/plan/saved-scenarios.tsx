"use client";

import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { useSavedScenarios } from "@/lib/plan";
import { formatDate, formatRange } from "@/utils/format";

/** Plans saved in this browser. */
export function SavedScenarios() {
  const saved = useSavedScenarios();
  if (!saved.length) return null;
  return (
    <Section title="Saved scenarios" description="Kept in this browser.">
      <ul className="divide-y divide-line">
        {saved.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13.5px]">
            <span className="min-w-0">
              <span className="block truncate font-medium">{s.name}</span>
              <span className="text-[12px] text-t3">
                {formatRange(s.range)} · saved {formatDate(s.created_at)}
              </span>
            </span>
            <span className="text-right">
              <Money kobo={s.total_reduction_kobo} sign="minus" className="text-brand" />
              <span className="block text-[12px] text-t3">
                of <Money kobo={s.baseline_kobo} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
