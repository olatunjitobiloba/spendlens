import { EvidenceLink } from "@/components/ui/evidence-link";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import type { Scenario } from "@/types/api";
import { formatRange } from "@/utils/format";
import { reviewHref } from "@/utils/links";
import { ExplanationPanel } from "./explanation-panel";
import { SaveScenario } from "./save-scenario";

function Totals({ scenario }: { scenario: Scenario }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-panel-raised/60 p-3">
        <dt className="text-[12.5px] text-t3">Spent (baseline)</dt>
        <dd className="mt-1 text-[18px] font-[600]">
          <Money kobo={scenario.baseline_kobo} />
        </dd>
      </div>
      <div className="rounded-xl bg-panel-raised/60 p-3">
        <dt className="text-[12.5px] text-t3">You could cut</dt>
        <dd className="mt-1 text-[18px] font-[600] text-brand">
          <Money kobo={scenario.total_reduction_kobo} sign="minus" />
        </dd>
      </div>
      <div className="rounded-xl bg-foreground p-3 text-background">
        <dt className="text-[12.5px] opacity-75">Spending would be</dt>
        <dd className="mt-1 text-[18px] font-[600]">
          <Money kobo={scenario.remaining_kobo} />
        </dd>
      </div>
    </dl>
  );
}

function Breakdown({ scenario, month }: { scenario: Scenario; month: string }) {
  const cut = scenario.categories.filter((c) => c.percent > 0);
  if (!cut.length) return <p className="mt-4 text-[13.5px] text-t3">No cuts chosen, so spending stays the same.</p>;
  return (
    <div className="mt-4 overflow-x-auto" tabIndex={0} aria-label="Cut by category">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead className="text-t3">
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-medium">Category</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Spent</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Cut</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Saves</th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Evidence</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {cut.map((c) => (
            <tr key={c.category}>
              <td className="py-2 pr-3">{c.category}</td>
              <td className="py-2 pr-3 text-right">
                <Money kobo={c.total_kobo} />
              </td>
              <td className="py-2 pr-3 text-right font-mono">{c.percent}%</td>
              <td className="py-2 pr-3 text-right">
                <Money kobo={c.reduction_kobo} sign="minus" />
              </td>
              <td className="py-2 text-right">
                <EvidenceLink href={reviewHref({ category: c.category, month })}>Transactions</EvidenceLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScenarioResult({ scenario, month, onSaved }: { scenario: Scenario; month: string; onSaved: () => void }) {
  return (
    <Section
      title="Result"
      description={formatRange(scenario.range)}
      aside={<Status tone="neutral">Scenario, not realised savings</Status>}
    >
      <Totals scenario={scenario} />
      <Breakdown scenario={scenario} month={month} />

      {scenario.coverage_warnings.map((w) => (
        <Notice key={w} tone="warn" className="mt-3" title="Based on incomplete data">
          {w}
        </Notice>
      ))}

      {scenario.evidence_txn_ids.length > 0 && (
        <p className="mt-3 text-[12.5px] text-t3">
          Based on {scenario.evidence_txn_ids.length} transactions.{" "}
          <EvidenceLink href={reviewHref({ ids: scenario.evidence_txn_ids.join(",") })}>See all of them</EvidenceLink>
        </p>
      )}

      <div className="mt-4 space-y-4">
        <ExplanationPanel key={scenario.id} scenarioId={scenario.id} />
        <SaveScenario key={scenario.id} scenario={scenario} onSaved={onSaved} />
      </div>
    </Section>
  );
}
