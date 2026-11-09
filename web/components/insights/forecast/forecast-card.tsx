import { Money } from "@/components/ui/money";
import { Status } from "@/components/ui/status";
import type { ForecastRow } from "@/types/api";
import { reviewHref } from "@/utils/links";
import { EvidenceLink } from "@/components/ui/evidence-link";

/** Point, low-high range and method, or an honest abstain (technical doc §10). */
export function ForecastCard({ row }: { row: ForecastRow }) {
  return (
    <li className="flex flex-col rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13.5px] font-medium">{row.category}</p>
        {row.abstained ? <Status tone="neutral">Not enough data yet</Status> : <Status tone="brand">Range</Status>}
      </div>

      {row.abstained ? (
        <p className="mt-3 text-[13px] text-t3">{row.reason ?? "There is not enough history for a forecast."}</p>
      ) : (
        <>
          <p className="mt-3 text-[22px] font-[600] tracking-[-0.03em]">
            <span className="sr-only">Likely about </span>
            <Money kobo={row.point_kobo ?? 0} className="font-sans" />
          </p>
          <p className="mt-0.5 text-[12.5px] text-t3">
            Between <Money kobo={row.low_kobo ?? 0} /> and <Money kobo={row.high_kobo ?? 0} />
          </p>
        </>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
        <p className="text-[11.5px] text-t4">
          {row.method} · {row.months_of_data} month{row.months_of_data === 1 ? "" : "s"} of data
        </p>
        <EvidenceLink href={reviewHref({ category: row.category })}>History</EvidenceLink>
      </div>
    </li>
  );
}
