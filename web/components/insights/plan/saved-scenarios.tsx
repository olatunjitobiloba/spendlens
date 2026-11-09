"use client";

import { Money } from "@/components/ui/money";
import { Section } from "@/components/ui/section";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useIsPro } from "@/providers/me-provider";
import { formatDate, formatRange } from "@/utils/format";

export function SavedScenarios({ version }: { version: number }) {
  const isPro = useIsPro();
  const saved = useResource(() => api.savedScenarios(), `saved|${version}`, isPro);
  if (!isPro || !saved.data?.length) return null;
  return (
    <Section title="Saved scenarios">
      <ul className="divide-y divide-line">
        {saved.data.map((s) => (
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
