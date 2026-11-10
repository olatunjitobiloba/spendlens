import {
  Analytics01Icon,
  Calculator01Icon,
  ChartLineData01Icon,
  Exchange01Icon,
  FileImportIcon,
  FloppyDiskIcon,
  MinusSignIcon,
  RepeatIcon,
  SquareLock02Icon,
  Task01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { cn } from "@/utils/cn";

type Row = { icon: IconSvgElement; title: string; detail: string; free: boolean | string; pro: boolean | string };

const groups: { label: string; rows: Row[] }[] = [
  {
    label: "See where your money goes",
    rows: [
      { icon: FileImportIcon, title: "Import statements", detail: "CSV files, checked row by row before saving.", free: true, pro: true },
      { icon: Analytics01Icon, title: "Monthly summary", detail: "Spending by category, with the transactions behind it.", free: true, pro: true },
      { icon: Task01Icon, title: "Review and correct", detail: "Fix categories and settle possible duplicates.", free: true, pro: true },
      { icon: RepeatIcon, title: "Recurring payments", detail: "Payments that repeat at a steady interval.", free: true, pro: true },
    ],
  },
  {
    label: "Plan a cut",
    rows: [
      { icon: SquareLock02Icon, title: "Protect essentials", detail: "Rent and bills are never cut.", free: true, pro: true },
      { icon: Calculator01Icon, title: "Test a savings cut", detail: "See what a cut per category would save.", free: true, pro: true },
      { icon: FloppyDiskIcon, title: "Saved scenarios", detail: "Keep the plans you test and come back to them.", free: false, pro: true },
    ],
  },
  {
    label: "Keep a plan going",
    rows: [
      { icon: Exchange01Icon, title: "Month comparison", detail: "Which categories went up or down, line by line.", free: false, pro: true },
      { icon: ChartLineData01Icon, title: "Spending forecast", detail: "A range per category for next month, or an honest “not enough data”.", free: false, pro: true },
    ],
  },
];

function Mark({ value, pro }: { value: boolean | string; pro?: boolean }) {
  if (typeof value === "string") return <span className="text-[12.5px] text-t2">{value}</span>;
  return value ? (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        pro ? "bg-brand/12 text-foreground" : "bg-brand/80 text-foreground",
      )}
    >
      <Icon icon={Tick02Icon} className="size-3.5" strokeWidth={2.4} />
      <span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-foreground/5 text-t4">
      <Icon icon={MinusSignIcon} className="size-3.5" />
      <span className="sr-only">Not included</span>
    </span>
  );
}

/** Free versus Pro, feature by feature. The Pro column is tinted so the eye lands there. */
export function PlanComparison({
  priceKobo,
  days,
  current,
  action,
}: {
  priceKobo: number;
  days: number;
  current: "free" | "pro";
  /** Shown at the foot of the Pro column, e.g. an upgrade button. */
  action?: React.ReactNode;
}) {
  const col = "w-[22%] min-w-[7.5rem] px-3 text-center";
  return (
    <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-panel" tabIndex={0} aria-label="Free and Pro compared">
      <table className="w-full min-w-[540px] border-collapse text-left text-[13.5px]">
        <caption className="sr-only">What Free and Pro include</caption>
        <thead>
          <tr>
            <th scope="col" className="px-5 pt-5 pb-4 align-bottom text-[12px] font-medium tracking-wide text-t4 uppercase">
              Features
            </th>
            <th scope="col" className={cn(col, "pt-5 pb-4 align-bottom font-normal")}>
              <span className="block text-[14px] font-[650]">Free</span>
              <span className="mt-1 block text-[22px] leading-none font-[650] tracking-[-0.03em]">₦0</span>
              <span className="mt-1 block text-[11.5px] text-t3">Always</span>
              {current === "free" && (
                <span className="mt-2 inline-block rounded-full bg-foreground/6 px-2 py-0.5 text-[11px] text-t3">
                  Your plan
                </span>
              )}
            </th>
            <th scope="col" className={cn(col, "rounded-t-2xl bg-brand/[0.07] pt-5 pb-4 align-bottom font-normal")}>
              <span className="inline-flex items-center gap-1.5 text-[14px] font-[650] text-brand">Pro</span>
              <span className="mt-1 block text-[22px] leading-none font-[650] tracking-[-0.03em]">
                <Money kobo={priceKobo} className="font-sans" />
              </span>
              <span className="mt-1 block text-[11.5px] text-t3">One payment · {days} days</span>
              {current === "pro" && (
                <span className="mt-2 inline-block rounded-full bg-brand px-2 py-0.5 text-[11px] text-white">
                  Your plan
                </span>
              )}
            </th>
          </tr>
        </thead>
        {groups.map((g, gi) => (
          <tbody key={g.label}>
            <tr>
              <th
                scope="colgroup"
                colSpan={2}
                className="border-t border-line bg-panel-raised/40 px-5 py-2 text-[11.5px] font-medium tracking-wide text-t3 uppercase"
              >
                {g.label}
              </th>
              <td className="border-t border-line bg-brand/[0.1]" />
            </tr>
            {g.rows.map((r, ri) => {
              const last = gi === groups.length - 1 && ri === g.rows.length - 1;
              return (
                <tr key={r.title} className="border-t border-line">
                  <th scope="row" className="px-5 py-3 font-normal">
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Icon icon={r.icon} className="size-4" />
                      </span>
                      <span>
                        <span className="block font-medium">{r.title}</span>
                        <span className="block text-[12.5px] text-t3">{r.detail}</span>
                      </span>
                    </span>
                  </th>
                  <td className={col}>
                    <Mark value={r.free} />
                  </td>
                  <td className={cn(col, "bg-brand/[0.07]", last && !action && "rounded-b-2xl")}>
                    <Mark value={r.pro} pro />
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
        {action && (
          <tfoot>
            <tr className="border-t border-line">
              <td colSpan={2} />
              <td className={cn(col, "rounded-b-2xl bg-brand/[0.07] pt-3 pb-4")}>{action}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** Compact list of what Pro adds, for the "you have Pro" view. */
export function ProFeatures() {
  const extras = groups.flatMap((g) => g.rows).filter((r) => !r.free);
  return (
    <ul className="space-y-3">
      {extras.map((f) => (
        <li key={f.title} className="flex gap-3 text-[13.5px]">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon icon={f.icon} className="size-4" />
          </span>
          <span>
            <span className="font-medium">{f.title}</span>
            <span className="block text-t3">{f.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
