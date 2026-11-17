"use client";

import { Csv02Icon, Pdf02Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { formatRange } from "@/utils/format";
import { RowsSkeleton } from "../skeletons";

/** Imports so far, read from GET /v1/analysis. The API has no delete route. */
export function PastImports() {
  const analysis = useResource(() => api.analysis.get(), "imports");

  if (!analysis.data) {
    return analysis.loading ? (
      <Section title="Your imports" className="mt-6">
        <RowsSkeleton rows={2} />
      </Section>
    ) : null;
  }
  const imports = analysis.data.imports;
  if (!imports.length) return null;

  return (
    <Section title="Your imports" className="mt-6">
      <ul className="divide-y divide-line">
        {imports.map((imp) => (
          <li key={imp.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon
                icon={imp.filename.toLowerCase().endsWith(".pdf") ? Pdf02Icon : Csv02Icon}
                className="size-[18px]"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{imp.filename}</span>
              <span className="text-[12.5px] text-t3">
                {imp.row_count} rows{imp.date_range ? ` · ${formatRange(imp.date_range)}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
