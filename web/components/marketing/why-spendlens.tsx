import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";

import { KoraLogo } from "@/components/brand/kora-logo";
import { why } from "@/configs/marketing";
import { fmtWhole } from "@/lib/format";
import { sampleScenario } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Status } from "./visuals/primitives";

function Cell({
  title,
  body,
  className,
  children,
}: {
  title: string;
  body: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={cn("panel flex flex-col overflow-hidden", className)}>
      <div className="p-6 pb-0 sm:p-7 sm:pb-0">
        <h3 className="text-[17px] font-[600] tracking-[-0.02em]">{title}</h3>
        <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-t3">{body}</p>
      </div>
      <div className="mt-6 flex flex-1 items-end p-3 pt-0 sm:p-4 sm:pt-0">{children}</div>
    </article>
  );
}

function Inset({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("w-full rounded-[1.25rem] border border-line bg-panel-raised/60 p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}

function CodeMaths() {
  const rows = [
    ["baseline", fmtWhole(sampleScenario.baseline)],
    ...sampleScenario.cuts.map((c) => [c.name.toLowerCase().replace(" ", "_"), `−${fmtWhole(c.amount)}`]),
  ];
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      <Inset className="font-mono text-[12.5px]">
        <p className="mb-3 text-t3">calculated by code</p>
        <ul className="space-y-1.5">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4">
              <span className="text-t3">{k}</span>
              <span className="tabular-nums">{v}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 border-t border-line pt-2">
            <span>result</span>
            <span className="tabular-nums text-brand">{fmtWhole(sampleScenario.result)}</span>
          </li>
        </ul>
      </Inset>
      <Inset className="flex flex-col">
        <p className="mb-3 font-mono text-[12.5px] text-t3">explained by AI</p>
        <p className="text-[14px] leading-relaxed text-t2">
          Your spend would come down to {fmtWhole(sampleScenario.result)} this month. More than half of
          the saving comes from eating out. Rent and groceries are protected, so they stay as they are.
        </p>
        <p className="mt-auto pt-4 text-xs text-t3">Every figure above is quoted from the calculation.</p>
      </Inset>
    </div>
  );
}

function Essentials() {
  const items = [
    { name: "Rent", on: true },
    { name: "Food and groceries", on: true },
    { name: "Eating out", on: false },
    { name: "Subscriptions", on: false },
  ];
  return (
    <Inset>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.name} className="flex items-center justify-between gap-3 text-[13.5px]">
            <span className="flex items-center gap-2 text-t2">
              {i.on && <HugeiconsIcon icon={SquareLock02Icon} className="size-4 text-t3" strokeWidth={1.8} />}
              {i.name}
            </span>
            <span className="flex items-center gap-2 text-xs text-t3">
              {i.on ? "Protected" : "Can be cut"}
              <span
                aria-hidden="true"
                className={cn(
                  "relative inline-flex h-5 w-9 rounded-full border transition-colors",
                  i.on ? "border-brand bg-brand" : "border-line-strong bg-foreground/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow-sm",
                    i.on ? "right-0.5" : "left-0.5",
                  )}
                />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Inset>
  );
}

function Uncertainty() {
  const rows = [
    { tone: "warn" as const, label: "Possible duplicate", detail: "Two ₦12,500 payments, same day" },
    { tone: "neutral" as const, label: "Not enough data", detail: "Only 9 days of transport spend" },
    { tone: "neutral" as const, label: "Needs review", detail: "POS transfer with no category" },
  ];
  return (
    <Inset>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col items-start gap-1.5">
            <Status tone={r.tone}>{r.label}</Status>
            <span className="text-[13px] text-t3">{r.detail}</span>
          </li>
        ))}
      </ul>
    </Inset>
  );
}

function Receipts() {
  const txns = [
    { date: "03 Oct", desc: "Suya spot, Lekki Phase 1", amount: 450_000 },
    { date: "11 Oct", desc: "Food delivery order", amount: 780_000 },
    { date: "18 Oct", desc: "Lunch, office canteen", amount: 320_000 },
  ];
  return (
    <Inset>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[14px] font-medium">Eating out</p>
        <p className="text-xs text-t3">{fmtWhole(5_620_000)} across 14 transactions</p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {txns.map((t) => (
          <li key={t.desc} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-2.5 text-[13px]">
            <span className="font-mono text-xs text-t3">{t.date}</span>
            <span className="truncate text-t2">{t.desc}</span>
            <span className="font-mono tabular-nums text-t2">{fmtWhole(t.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-brand">View all 14 transactions</p>
    </Inset>
  );
}

function ApiSurface() {
  const endpoints = [
    ["POST", "/v1/imports/preview", "Check a CSV, store nothing"],
    ["GET", "/v1/analysis", "Totals, coverage, warnings"],
    ["PUT", "/v1/protections", "Lock essential categories"],
    ["POST", "/v1/scenarios", "Calculate a savings cut"],
    ["DELETE", "/v1/me/data", "Remove everything"],
  ];
  return (
    <Inset className="overflow-x-auto p-0 sm:p-0">
      <table className="w-full min-w-[420px] text-left font-mono text-[12.5px]">
        <caption className="sr-only">Some SpendLens API endpoints</caption>
        <tbody className="divide-y divide-line">
          {endpoints.map(([method, path, note]) => (
            <tr key={path}>
              <td className="w-20 py-3 pl-4 text-brand sm:pl-5">{method}</td>
              <td className="py-3 pr-3">{path}</td>
              <td className="py-3 pr-4 font-sans text-[12.5px] text-t3 sm:pr-5">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Inset>
  );
}

function KoraPayment() {
  return (
    <Inset>
      <KoraLogo className="h-6 text-foreground" />
      <div className="mt-4 flex items-center justify-between gap-3 rounded-full border border-line bg-panel py-1.5 pr-1.5 pl-4">
        <span className="text-[13px] text-t2">Pro, 30 days</span>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-positive/12 px-2.5 text-[11.5px] font-medium text-positive">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" strokeWidth={2} />
          Paid, confirmed by server
        </span>
      </div>
    </Inset>
  );
}

export function WhySpendLens() {
  return (
    <section aria-labelledby="why-title" id="why" className="page py-20 sm:py-28">
      <SectionHeading id="why-title" title={why.title} description={why.description} />

      <div className="mt-10 grid gap-3 md:grid-cols-3 sm:mt-14">
        <Cell
          className="md:col-span-2"
          title="Code does the maths. AI only explains it."
          body="Totals and savings are calculated and checked before you see them. The explanation can only repeat numbers the calculation produced."
        >
          <CodeMaths />
        </Cell>
        <Cell
          title="Essentials stay off the table"
          body="Mark rent or groceries as protected and no scenario will ever touch them."
        >
          <Essentials />
        </Cell>
        <Cell
          title="Says when it isn't sure"
          body="Doubt is written in words, not hidden in a colour."
        >
          <Uncertainty />
        </Cell>
        <Cell
          className="md:col-span-2"
          title="Every finding shows its receipts"
          body="Tap any total and see the exact transactions behind it. Nothing is a black box."
        >
          <Receipts />
        </Cell>
        <Cell
          className="md:col-span-2"
          title="An API first, for banks and fintech apps"
          body="Your app keeps its own look. SpendLens returns the analysis, protections and scenarios as JSON for you to render."
        >
          <ApiSurface />
        </Cell>
        <Cell
          title="Payments through Kora"
          body="Pro unlocks only once our server sees the order paid. A browser callback is never enough."
        >
          <KoraPayment />
        </Cell>
      </div>
    </section>
  );
}
