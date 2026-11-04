import { HugeiconsIcon } from "@hugeicons/react";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";

import { fmtWhole } from "@/lib/format";
import {
  sampleCategories,
  sampleMonth,
  sampleProfiles,
  sampleScenario,
  sampleShares,
} from "@/lib/sample-data";
import { Avatar, WindowBar } from "./primitives";

export function ScenarioPreview() {
  const { customer } = sampleProfiles;

  return (
    <figure className="panel overflow-hidden">
      <figcaption className="sr-only">
        A sample SpendLens review for {sampleMonth}, showing spend by category and a savings
        scenario.
      </figcaption>

      <WindowBar title="Partner Bank · Money Insights" />

      <div className="p-2 sm:p-3">
      <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3 sm:px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar seed={customer.seed} name={customer.name} size={34} />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold">{customer.name}</p>
            <p className="truncate text-xs text-t3">{sampleMonth} · synthetic data</p>
          </div>
        </div>
        <p className="hidden text-xs text-t3 sm:block">Powered by SpendLens API</p>
      </div>

      <div className="grid gap-2 md:grid-cols-[1.35fr_1fr]">
        {/* Spend by category */}
        <div className="rounded-[1.25rem] border border-line bg-panel-raised/50 p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-medium text-t3">Spent this month</p>
            <p className="font-mono text-[13px] text-t3">{sampleCategories.length} categories</p>
          </div>
          <p className="mt-1 text-[30px] font-[600] leading-none tracking-[-0.04em] tabular-nums sm:text-[34px]">
            {fmtWhole(sampleScenario.baseline)}
          </p>

          <ul className="mt-5 space-y-3">
            {sampleCategories.map((c) => (
              <li key={c.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-1.5 text-[13px] text-t2">
                  {c.name}
                  {c.protected && (
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-t3">
                      <HugeiconsIcon icon={SquareLock02Icon} className="size-3.5" strokeWidth={1.8} />
                      Protected
                    </span>
                  )}
                </span>
                <span className="text-right font-mono text-[12.5px] tabular-nums text-t2">
                  {fmtWhole(c.amount)}
                </span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <span
                    className={
                      c.protected ? "block h-full rounded-full bg-t4" : "block h-full rounded-full bg-brand"
                    }
                    style={{ width: `${sampleShares[c.name]}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Scenario */}
        <div className="flex flex-col rounded-[1.25rem] border border-line bg-panel-raised/50 p-4 sm:p-5">
          <p className="text-[13px] font-medium text-t3">Scenario</p>
          <ul className="mt-3 divide-y divide-line">
            {sampleScenario.cuts.map((cut) => (
              <li key={cut.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13px] text-t2">
                  {cut.name} <span className="text-t3">−{cut.percent}%</span>
                </span>
                <span className="font-mono text-[12.5px] tabular-nums text-t2">
                  −{fmtWhole(cut.amount)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-auto space-y-2 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-t3">Baseline</dt>
              <dd className="font-mono tabular-nums">{fmtWhole(sampleScenario.baseline)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-t3">Reduction</dt>
              <dd className="font-mono tabular-nums text-brand">
                −{fmtWhole(sampleScenario.reduction)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-1">
              <dt className="font-medium">Result</dt>
              <dd className="text-[22px] font-[600] tracking-[-0.03em] tabular-nums">
                {fmtWhole(sampleScenario.result)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-t3">Scenario, not realised savings.</p>
        </div>
      </div>
      </div>
    </figure>
  );
}
