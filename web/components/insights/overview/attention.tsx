import { Notification03Icon } from "@hugeicons/core-free-icons";

import { EmptyState } from "@/components/ui/empty-state";
import { EvidenceLink } from "@/components/ui/evidence-link";
import { HeaderLink } from "@/components/ui/header-link";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import type { Analysis } from "@/types/api";
import { reviewHref } from "@/utils/links";

const isGap = (w: string) => w.startsWith("No transactions for");

/** Uncertainty stated in words, each with a link to act on it (PRD R2, R3). */
export function Attention({ analysis: a, month }: { analysis: Analysis | null; month: string }) {
  const dupes = a?.reconciliation_candidates.length ?? 0;
  const review = a?.needs_review_count ?? 0;
  const gaps = a?.coverage_warnings.filter(isGap) ?? [];
  const clear = !dupes && !review && !gaps.length;

  return (
    <Section
      title="Needs your attention"
      description="Things SpendLens was unsure about"
      aside={a && <HeaderLink href="/insights/review">View all</HeaderLink>}
      className="flex flex-col"
    >
      {clear ? (
        <EmptyState icon={Notification03Icon} title="All clear" className="flex-1">
          {a ? "Nothing is waiting for your review." : "Flags appear here once transactions arrive."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line text-[13.5px]">
          {review > 0 && (
            <li className="flex flex-col gap-1.5 py-2.5 first:pt-0">
              <Status tone="warn" className="self-start">
                Needs review
              </Status>
              <span>
                {review} transaction{review === 1 ? " has" : "s have"} no category.{" "}
                <EvidenceLink href={reviewHref({ filter: "needs_review" })}>Review</EvidenceLink>
              </span>
            </li>
          )}
          {dupes > 0 && (
            <li className="flex flex-col gap-1.5 py-2.5 first:pt-0">
              <Status tone="warn" className="self-start">
                Possible duplicate
              </Status>
              <span>
                {dupes} pair{dupes === 1 ? "" : "s"} may be the same payment.{" "}
                <EvidenceLink href="/insights/review?tab=duplicates">Compare</EvidenceLink>
              </span>
            </li>
          )}
          {gaps.map((w) => (
            <li key={w} className="flex flex-col gap-1.5 py-2.5 first:pt-0">
              <Status tone="neutral" className="self-start">
                Gap in data
              </Status>
              <span>
                {w} <EvidenceLink href={reviewHref({ month })}>See month</EvidenceLink>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
