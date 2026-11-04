import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Csv01Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";

import { KoraLogo } from "@/components/brand/kora-logo";
import { fmtWhole } from "@/lib/format";
import { sampleProfiles, sampleScenario } from "@/lib/sample-data";
import { Avatar, Deck, MockCard, Status } from "./primitives";

function FakeButton({ primary, children }: { primary?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        primary
          ? "inline-flex h-8 flex-1 items-center justify-center rounded-full bg-brand px-3 text-[12.5px] font-medium text-white"
          : "inline-flex h-8 flex-1 items-center justify-center rounded-full border border-line-strong px-3 text-[12.5px] font-medium text-t2"
      }
    >
      {children}
    </span>
  );
}

export function ImportVisual() {
  const { customer } = sampleProfiles;
  return (
    <Deck>
      <MockCard>
        <div className="flex items-center gap-3">
          <Avatar seed={customer.seed} name={customer.name} size={38} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold">{customer.name}</p>
            <p className="truncate text-xs text-t3">{customer.detail}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-foreground/[0.04] p-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand/12 text-brand">
            <HugeiconsIcon icon={Csv01Icon} className="size-[18px]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[12.5px]">statement-oct-2026.csv</p>
            <p className="text-xs text-t3">214 rows · 01 to 31 Oct · 1 account</p>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-[12.5px]">
          <li className="flex items-center gap-2 text-t2">
            <HugeiconsIcon icon={Alert02Icon} className="size-3.5 text-warn" strokeWidth={2} />
            Line 18: date isn&apos;t a real date
          </li>
          <li className="flex items-center gap-2 text-t2">
            <HugeiconsIcon icon={Alert02Icon} className="size-3.5 text-warn" strokeWidth={2} />
            Line 77: amount is missing
          </li>
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Status tone="warn">2 rows need fixing</Status>
          <span className="text-xs text-t3">Nothing saved yet</span>
        </div>
      </MockCard>
    </Deck>
  );
}

export function ReviewVisual() {
  const rows = [
    { time: "14 Oct, 10:02", ref: "TRF/88213" },
    { time: "14 Oct, 10:03", ref: "TRF/88214" },
  ];
  return (
    <Deck>
      <MockCard>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold">Transfer to Ada N.</p>
          <Status tone="warn">Possible duplicate</Status>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <div key={r.ref} className="rounded-xl bg-foreground/[0.04] p-3">
              <p className="text-[15px] font-[600] tabular-nums">{fmtWhole(1_250_000)}</p>
              <p className="mt-1 text-xs text-t3">{r.time}</p>
              <p className="font-mono text-[11.5px] text-t3">{r.ref}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <FakeButton primary>Same payment</FakeButton>
          <FakeButton>Different payments</FakeButton>
        </div>
      </MockCard>
    </Deck>
  );
}

export function PlanVisual() {
  const cut = sampleScenario.cuts[0];
  return (
    <Deck>
      <MockCard>
        <ul className="space-y-2 text-[13px]">
          {["Rent", "Food and groceries"].map((n) => (
            <li key={n} className="flex items-center justify-between gap-3 text-t3">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={SquareLock02Icon} className="size-4" strokeWidth={1.8} />
                {n}
              </span>
              <span className="text-xs">Protected</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-foreground/[0.04] p-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium">{cut.name}</span>
            <span className="font-mono tabular-nums text-brand">−{cut.percent}%</span>
          </div>
          <div className="relative mt-3 h-1.5 rounded-full bg-foreground/[0.08]">
            <span className="absolute inset-y-0 left-0 w-1/5 rounded-full bg-brand" />
            <span className="absolute top-1/2 left-1/5 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-white" />
          </div>
          <p className="mt-3 text-xs text-t3">Saves {fmtWhole(cut.amount)} this month</p>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-t3">Result with all cuts</span>
          <span className="text-[20px] font-[600] tracking-[-0.03em] tabular-nums">
            {fmtWhole(sampleScenario.result)}
          </span>
        </div>
      </MockCard>
    </Deck>
  );
}

export function ProVisual() {
  const { customer } = sampleProfiles;
  const timeline = ["Checkout opened", "Payment received by Kora", "Confirmed by SpendLens server"];
  return (
    <Deck>
      <MockCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar seed={customer.seed} name={customer.name} size={38} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">SpendLens Pro</p>
              <p className="truncate text-xs text-t3">30 days · {customer.name}</p>
            </div>
          </div>
          <KoraLogo className="h-4 text-foreground" />
        </div>

        <ol className="mt-4 space-y-2.5">
          {timeline.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-[13px] text-t2">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-positive" strokeWidth={2} />
              {t}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Status tone="positive">Pro unlocked</Status>
          <span className="text-xs text-t3">Thu, 10:00</span>
        </div>
      </MockCard>
    </Deck>
  );
}
