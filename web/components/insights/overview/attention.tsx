import { Alert02Icon } from "@hugeicons/core-free-icons";

import { EvidenceLink } from "@/components/ui/evidence-link";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import type { Analysis } from "@/types/api";
import { reviewHref } from "@/utils/links";

const isDuplicateWarning = (w: string) => w.includes("possible duplicate");

/** Uncertainty stated in words, each with a link to act on it (PRD R2, R3). */
export function Attention({ analysis, month }: { analysis: Analysis; month: string }) {
  const dupes = analysis.reconciliation_candidates.length;
  const review = analysis.needs_review_count;
  const gaps = analysis.coverage_warnings.filter((w) => !isDuplicateWarning(w));

  if (!dupes && !review && !gaps.length) {
    return (
      <Notice tone="positive" title="Nothing needs your review">
        Every transaction has a category and no possible duplicates are waiting.
      </Notice>
    );
  }

  const row = "flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0";
  return (
    <Section title="Needs your attention" aside={<Icon icon={Alert02Icon} className="text-warn" />}>
      <ul className="divide-y divide-line text-[13.5px]">
        {review > 0 && (
          <li className={row}>
            <span className="flex items-center gap-2">
              <Status tone="warn">Needs review</Status>
              {review} transaction{review === 1 ? " has" : "s have"} no category
            </span>
            <EvidenceLink href={reviewHref({ filter: "needs_review" })}>Review</EvidenceLink>
          </li>
        )}
        {dupes > 0 && (
          <li className={row}>
            <span className="flex items-center gap-2">
              <Status tone="warn">Possible duplicate</Status>
              {dupes} pair{dupes === 1 ? "" : "s"} may be the same payment
            </span>
            <EvidenceLink href="/insights/review#duplicates">Compare</EvidenceLink>
          </li>
        )}
        {gaps.map((w) => (
          <li key={w} className={row}>
            <span className="flex items-center gap-2">
              <Status tone="neutral">Gap in data</Status>
              {w}
            </span>
            <EvidenceLink href={reviewHref({ month })}>See this month</EvidenceLink>
          </li>
        ))}
      </ul>
    </Section>
  );
}
