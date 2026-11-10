import { Section } from "@/components/ui/section";
import type { Analysis } from "@/types/api";
import { formatDate } from "@/utils/format";

/** Coverage summary: what the data spans and what is still open. */
export function ReviewStats({ analysis: a }: { analysis: Analysis }) {
  const dupes = a.reconciliation_candidates.length;
  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-3">
      <Section>
        <p className="text-[13px] text-t3">Data covers</p>
        <p className="mt-1 text-[15px] font-[600]">
          {a.data_range ? `${formatDate(a.data_range.start)} – ${formatDate(a.data_range.end)}` : "No dates"}
        </p>
        <p className="mt-0.5 text-[12.5px] text-t3">
          {a.imports.length} import{a.imports.length === 1 ? "" : "s"}
        </p>
      </Section>
      <Section>
        <p className="text-[13px] text-t3">Needs review</p>
        <p className="mt-1 font-mono text-[22px] tabular-nums">{a.needs_review_count}</p>
        <p className="text-[12.5px] text-t3">{a.needs_review_count ? "without a category" : "All categorised"}</p>
      </Section>
      <Section>
        <p className="text-[13px] text-t3">Possible duplicates</p>
        <p className="mt-1 font-mono text-[22px] tabular-nums">{dupes}</p>
        <p className="text-[12.5px] text-t3">{dupes ? "pairs to compare" : "None waiting"}</p>
      </Section>
    </div>
  );
}
