import Image from "next/image";
import {
  ArrowDataTransferHorizontalIcon,
  ArrowDownLeft01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  EyeIcon,
  Home01Icon,
  Invoice01Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  PieChartIcon,
  PiggyBankIcon,
  SmartPhone01Icon,
  SquareLock02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";

import { LogoMark } from "@/components/brand/logo";
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { bankLogo } from "@/configs/banks";
import { inkColor, onColor, type BankApp } from "@/configs/bank-apps";
import type { SimScreen, SimState } from "@/configs/integration";
import {
  sampleCategories,
  sampleEatingOutCut,
  sampleMonth,
  sampleProfiles,
  sampleScenario,
  sampleShares,
} from "@/configs/sample-data";
import { fmt, fmtWhole } from "@/utils/format";
import { cn } from "@/utils/cn";

const firstName = sampleProfiles.customer.name.split(" ")[0];
const initials = sampleProfiles.customer.name
  .split(" ")
  .map((w) => w[0])
  .join("");
const monthName = sampleMonth.split(" ")[0];

const PALETTES = {
  light: { bg: "#F3F4F6", card: "#FFFFFF", tx: "#0B0B0C", mu: "#6B6B74", ln: "rgb(0 0 0 / 0.07)" },
  dark: { bg: "#0D0E11", card: "#17181C", tx: "#F4F4F5", mu: "#9D9DA6", ln: "rgb(255 255 255 / 0.08)" },
} as const;

/** CSS variables for one bank's app. Screens read them via bg-(--b), text-(--ink) and so on. */
export function themeVars(bank: BankApp): React.CSSProperties {
  const dark = bank.layout === "dark";
  const p = PALETTES[dark ? "dark" : "light"];
  return {
    "--b": bank.color,
    "--on": onColor(bank.color),
    "--ink": dark ? bank.color : inkColor(bank.color),
    "--bg": p.bg,
    "--card": p.card,
    "--tx": p.tx,
    "--mu": p.mu,
    "--ln": p.ln,
  } as React.CSSProperties;
}

/** Colour of the status bar text on a given screen. */
export function statusColorFor(bank: BankApp, screen: SimScreen) {
  if (bank.layout === "dark") return "#FFFFFF";
  if (bank.layout === "classic") return onColor(bank.color);
  return screen === "home" ? "#0B0B0C" : onColor(bank.color);
}

function BankMark({ bank, size = 28 }: { bank: BankApp; size?: number }) {
  return (
    <Image
      src={bankLogo(bank)}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-[9px] bg-white object-contain p-0.5"
      style={{ width: size, height: size }}
    />
  );
}

function ActionTile({ icon, label, sim, highlight }: { icon: IconSvgElement; label: string; sim?: string; highlight?: boolean }) {
  return (
    <div data-sim={sim} className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-[14px]",
          highlight ? "bg-(--b) text-(--on)" : "bg-(--b)/10 text-(--ink)",
        )}
      >
        <Icon icon={icon} className="size-[19px]" />
      </span>
      <span className={cn("text-center text-[10.5px] leading-tight", highlight ? "font-semibold text-(--tx)" : "text-(--mu)")}>
        {label}
      </span>
    </div>
  );
}

const TRANSACTIONS = [
  { name: "Chicken Republic", detail: "Today, 1:24 pm", amount: -485_000 },
  { name: "Transfer from Ada", detail: "Yesterday", amount: 2_500_000 },
  { name: "MTN airtime", detail: "Yesterday", amount: -200_000 },
] as const;

function Transactions() {
  return (
    <div className="rounded-2xl bg-(--card) px-3.5 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-(--tx)">Recent transactions</p>
        <p className="text-[10.5px] text-(--ink)">See all</p>
      </div>
      <ul className="mt-2 divide-y divide-(--ln)">
        {TRANSACTIONS.map((t) => (
          <li key={t.name} className="flex items-center gap-2.5 py-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-(--b)/10 text-(--ink)">
              <Icon icon={t.amount > 0 ? ArrowDownLeft01Icon : ArrowUpRight01Icon} className="size-3.5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] font-medium text-(--tx)">{t.name}</span>
              <span className="block text-[10px] text-(--mu)">{t.detail}</span>
            </span>
            <span className={cn("font-mono text-[11px] tabular-nums", t.amount > 0 ? "text-[#0F8A50]" : "text-(--tx)")}>
              {t.amount > 0 ? "+" : "−"}
              {fmtWhole(Math.abs(t.amount))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BottomNav() {
  const items = [
    { icon: Home01Icon, label: "Home", active: true },
    { icon: ArrowDataTransferHorizontalIcon, label: "Payments" },
    { icon: CreditCardIcon, label: "Cards" },
    { icon: MoreHorizontalIcon, label: "More" },
  ];
  return (
    <nav className="absolute inset-x-0 bottom-0 grid grid-cols-4 border-t border-(--ln) bg-(--card) px-2 pt-2 pb-5">
      {items.map((it) => (
        <span key={it.label} className={cn("flex flex-col items-center gap-0.5 text-[9.5px]", it.active ? "text-(--ink)" : "text-(--mu)")}>
          <Icon icon={it.icon} className="size-[18px]" />
          {it.label}
        </span>
      ))}
    </nav>
  );
}

const BALANCE = 48_625_040;

function HomeClassic({ bank, top }: { bank: BankApp; top: number }) {
  return (
    <div className="h-full bg-(--bg)">
      <div className="bg-(--b) px-4 pb-8 text-(--on)" style={{ paddingTop: top + 6 }}>
        <div className="flex items-center gap-2.5">
          <BankMark bank={bank} />
          <p className="flex-1 text-[12.5px] font-medium">Good morning, {firstName}</p>
          <Icon icon={Notification01Icon} className="size-[18px]" />
        </div>
        <div data-sim="balance" className="mt-5">
          <p className="flex items-center gap-1.5 text-[11px] opacity-75">
            Available balance <Icon icon={EyeIcon} className="size-3.5" />
          </p>
          <p className="mt-1 text-[25px] font-semibold tracking-[-0.03em] tabular-nums">{fmt(BALANCE)}</p>
          <p className="mt-0.5 font-mono text-[10.5px] opacity-75">0123456789 · Savings</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px] font-medium">
          <span className="rounded-xl bg-(--on)/15 py-2 text-center">Transfer</span>
          <span className="rounded-xl bg-(--on)/15 py-2 text-center">Add money</span>
        </div>
      </div>
      <div className="-mt-4 space-y-3 rounded-t-[22px] bg-(--bg) px-4 pt-4">
        <div className="grid grid-cols-4 gap-y-3 rounded-2xl bg-(--card) px-1 py-3.5">
          <ActionTile icon={SmartPhone01Icon} label="Airtime" />
          <ActionTile icon={Invoice01Icon} label="Bills" />
          <ActionTile icon={PiggyBankIcon} label="Savings" />
          <ActionTile icon={PieChartIcon} label="Insights" sim="insights" highlight />
        </div>
        <Transactions />
      </div>
      <BottomNav />
    </div>
  );
}

function HomeCard({ bank, top }: { bank: BankApp; top: number }) {
  return (
    <div className="h-full space-y-3 bg-(--bg) px-4" style={{ paddingTop: top + 8 }}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-(--b)/12 text-[11px] font-semibold text-(--ink)">
          {initials}
        </span>
        <p className="flex-1 text-[13px] font-semibold text-(--tx)">Hi, {firstName}</p>
        <BankMark bank={bank} size={26} />
      </div>
      <div data-sim="balance" className="rounded-[20px] bg-(--b) p-4 text-(--on)">
        <p className="flex items-center gap-1.5 text-[11px] opacity-80">
          Total balance <Icon icon={EyeIcon} className="size-3.5" />
        </p>
        <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em] tabular-nums">{fmt(BALANCE)}</p>
        <div className="mt-3 flex gap-2 text-[11px] font-medium">
          <span className="flex-1 rounded-xl bg-(--on)/15 py-1.5 text-center">Add money</span>
          <span className="flex-1 rounded-xl bg-(--on)/15 py-1.5 text-center">Send</span>
        </div>
      </div>
      <div className="grid grid-cols-4 rounded-2xl bg-(--card) py-3">
        <ActionTile icon={ArrowDataTransferHorizontalIcon} label="Transfer" />
        <ActionTile icon={SmartPhone01Icon} label="Airtime" />
        <ActionTile icon={Invoice01Icon} label="Bills" />
        <ActionTile icon={PiggyBankIcon} label="Save" />
      </div>
      <div data-sim="insights" className="flex items-center gap-3 rounded-2xl border border-(--b)/25 bg-(--card) p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--b) text-(--on)">
          <Icon icon={PieChartIcon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold text-(--tx)">Spending insights</span>
          <span className="block text-[10.5px] leading-snug text-(--mu)">See where your {monthName} money went</span>
        </span>
        <Icon icon={ArrowRight01Icon} className="size-4 text-(--ink)" />
      </div>
      <Transactions />
      <BottomNav />
    </div>
  );
}

function HomeDark({ bank, top }: { bank: BankApp; top: number }) {
  return (
    <div className="h-full bg-(--bg) px-4" style={{ paddingTop: top + 8 }}>
      <div className="flex items-center gap-2.5">
        <BankMark bank={bank} size={26} />
        <p className="flex-1 text-[12.5px] font-medium text-(--tx)">{bank.short}</p>
        <Icon icon={Notification01Icon} className="size-[18px] text-(--mu)" />
      </div>
      <div data-sim="balance" className="mt-6">
        <p className="text-[11px] text-(--mu)">Hello {firstName}, your balance</p>
        <p className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-(--tx) tabular-nums">{fmt(BALANCE)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px] font-semibold">
        <span className="rounded-xl bg-(--b) py-2.5 text-center text-(--on)">Send money</span>
        <span className="rounded-xl bg-(--card) py-2.5 text-center text-(--tx)">Add money</span>
      </div>
      <p className="mt-5 mb-2 text-[11px] font-medium text-(--mu)">Explore</p>
      <div className="divide-y divide-(--ln) rounded-2xl bg-(--card)">
        <div data-sim="insights" className="flex items-center gap-3 p-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--b)/15 text-(--ink)">
            <Icon icon={PieChartIcon} className="size-4" />
          </span>
          <span className="flex-1">
            <span className="block text-[12px] font-semibold text-(--tx)">Spending insights</span>
            <span className="block text-[10.5px] text-(--mu)">Your {monthName} review is ready</span>
          </span>
          <Icon icon={ArrowRight01Icon} className="size-4 text-(--mu)" />
        </div>
        <div className="flex items-center gap-3 p-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--tx)/8 text-(--mu)">
            <Icon icon={Wallet01Icon} className="size-4" />
          </span>
          <span className="flex-1 text-[12px] font-medium text-(--tx)">Cards and limits</span>
          <Icon icon={ArrowRight01Icon} className="size-4 text-(--mu)" />
        </div>
      </div>
      <div className="mt-3">
        <Transactions />
      </div>
      <BottomNav />
    </div>
  );
}

/** App bar for the SpendLens screens, styled like the bank's own header. */
function AppBar({ bank, top, title }: { bank: BankApp; top: number; title: string }) {
  const solid = bank.layout !== "dark";
  return (
    <div
      className={cn("flex items-center gap-2 px-3 pb-3", solid ? "bg-(--b) text-(--on)" : "text-(--tx)")}
      style={{ paddingTop: top + 4 }}
    >
      <Icon icon={ArrowLeft01Icon} className="size-[18px]" />
      <p className="flex-1 text-[13.5px] font-semibold">{title}</p>
      <BankMark bank={bank} size={22} />
    </div>
  );
}

function PoweredBy() {
  return (
    <p className="mt-auto flex items-center justify-center gap-1.5 pt-3 pb-6 text-[9.5px] text-(--mu)">
      <LogoMark size={12} />
      Insights by SpendLens
    </p>
  );
}

function PrimaryButton({ sim, children }: { sim: string; children: React.ReactNode }) {
  return (
    <div data-sim={sim} className="rounded-[14px] bg-(--b) py-3 text-center text-[12.5px] font-semibold text-(--on)">
      {children}
    </div>
  );
}

const topCategories = sampleCategories.slice(0, 5);

function Overview({ bank, top }: { bank: BankApp; top: number }) {
  return (
    <div className="flex h-full flex-col bg-(--bg)">
      <AppBar bank={bank} top={top} title="Spending insights" />
      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-3">
        <div data-sim="total" className="rounded-2xl bg-(--card) p-3.5">
          <p className="text-[11px] text-(--mu)">Spent in {sampleMonth}</p>
          <p className="mt-0.5 text-[24px] font-semibold tracking-[-0.03em] text-(--tx) tabular-nums">
            {fmtWhole(sampleScenario.baseline)}
          </p>
          <p className="mt-0.5 text-[10.5px] text-(--mu)">{sampleCategories.length} categories · 142 transactions</p>
        </div>
        <div data-sim="categories" className="rounded-2xl bg-(--card) p-3.5">
          <p className="text-[12px] font-semibold text-(--tx)">Where it went</p>
          <ul className="mt-2.5 space-y-2.5">
            {topCategories.map((c) => (
              <li key={c.name} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                <span className="text-[11px] text-(--tx)">{c.name}</span>
                <span className="font-mono text-[10.5px] text-(--mu) tabular-nums">{fmtWhole(c.amount)}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-(--tx)/8">
                  <span className="block h-full rounded-full bg-(--b)" style={{ width: `${sampleShares[c.name] * 2.4}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <PrimaryButton sim="protect-cta">Plan a cut</PrimaryButton>
        <PoweredBy />
      </div>
    </div>
  );
}

function Toggle({ on, sim }: { on: boolean; sim?: string }) {
  return (
    <span
      data-sim={sim}
      role="presentation"
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200", on ? "bg-(--b)" : "bg-(--tx)/15")}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          on && "translate-x-4",
        )}
      />
    </span>
  );
}

function Protect({ bank, top, state }: { bank: BankApp; top: number; state: SimState }) {
  const rows = [
    { name: "Rent", amount: sampleCategories[0].amount, on: state.rent, sim: "toggle-rent" },
    { name: "Food and groceries", amount: sampleCategories[1].amount, on: state.food, sim: "toggle-food" },
    { name: "Eating out", amount: sampleCategories[2].amount, on: false },
    { name: "Transport", amount: sampleCategories[3].amount, on: false },
    { name: "Subscriptions", amount: sampleCategories[5].amount, on: false },
  ];
  return (
    <div className="flex h-full flex-col bg-(--bg)">
      <AppBar bank={bank} top={top} title="Protect your bills" />
      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-4">
        <div className="px-0.5">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-(--tx)">Which costs can&apos;t you cut?</p>
          <p className="mt-1 text-[11px] leading-snug text-(--mu)">Protected categories are left out of every plan.</p>
        </div>
        <ul className="divide-y divide-(--ln) rounded-2xl bg-(--card) px-3.5">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[11.5px] font-medium text-(--tx)">
                  {r.name}
                  {r.on && <Icon icon={SquareLock02Icon} className="size-3 text-(--ink)" strokeWidth={2} />}
                </span>
                <span className="block font-mono text-[10px] text-(--mu) tabular-nums">{fmtWhole(r.amount)} a month</span>
              </span>
              <Toggle on={r.on} sim={r.sim} />
            </li>
          ))}
        </ul>
        <PrimaryButton sim="protect-next">Continue</PrimaryButton>
        <PoweredBy />
      </div>
    </div>
  );
}

// The slider runs from 0% to 50%, so a 20% cut sits 40% along the track.
const SLIDER_MAX = 50;

function Plan({ bank, top, state }: { bank: BankApp; top: number; state: SimState }) {
  const cut = state.cut > 0;
  const c = sampleEatingOutCut;
  const pos = `${(state.cut / SLIDER_MAX) * 100}%`;
  const protectedNames = [state.rent && "Rent", state.food && "food"].filter(Boolean).join(" and ");
  return (
    <div className="flex h-full flex-col bg-(--bg)">
      <AppBar bank={bank} top={top} title="Plan a cut" />
      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-4">
        <div className="rounded-2xl bg-(--card) p-3.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-semibold text-(--tx)">{c.category}</p>
            <p className="font-mono text-[10.5px] text-(--mu) tabular-nums">{fmtWhole(c.current)} a month</p>
          </div>
          <div className="relative mt-5 h-5">
            <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--tx)/10" />
            <span
              className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-(--b) transition-[width] duration-[1300ms] ease-[cubic-bezier(0.45,0,0.2,1)]"
              style={{ width: pos }}
            />
            <span
              className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--b) bg-white shadow-sm transition-[left] duration-[1300ms] ease-[cubic-bezier(0.45,0,0.2,1)]"
              style={{ left: pos }}
            />
            <span data-sim="slider-start" className="absolute top-1/2 left-0 size-1" />
            <span data-sim="slider-end" className="absolute top-1/2 left-[40%] size-1" />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9.5px] text-(--mu)">
            <span>0%</span>
            <span className={cn("text-[11px] font-semibold", cut ? "text-(--ink)" : "text-(--mu)")}>
              Cut by {state.cut}%
            </span>
            <span>{SLIDER_MAX}%</span>
          </div>
        </div>

        <div data-sim="result" className="rounded-2xl bg-(--card) p-3.5">
          <p className="text-[11px] text-(--mu)">You could keep</p>
          <p className="mt-0.5 text-[24px] font-semibold tracking-[-0.03em] text-(--tx) tabular-nums">
            {cut ? fmtWhole(c.monthly) : fmtWhole(0)}
            <span className="ml-1 text-[11px] font-normal text-(--mu)">a month</span>
          </p>
          <div className="mt-2.5 flex justify-between border-t border-(--ln) pt-2.5 text-[11px]">
            <span className="text-(--mu)">New monthly spend</span>
            <span className="font-mono text-(--tx) tabular-nums">{fmtWhole(cut ? c.result : sampleScenario.baseline)}</span>
          </div>
          <p className={cn("mt-2.5 text-[10.5px] leading-snug text-(--mu) transition-opacity duration-300", cut ? "opacity-100" : "opacity-0")}>
            Eating out drops by {c.percent}%. {protectedNames ? `${protectedNames} stay protected.` : ""}
          </p>
        </div>
        <PrimaryButton sim="save">Save this plan</PrimaryButton>
        <PoweredBy />
      </div>
    </div>
  );
}

function Saved({ bank, top, state }: { bank: BankApp; top: number; state: SimState }) {
  const c = sampleEatingOutCut;
  const protectedList = [state.rent && "Rent", state.food && "Food and groceries"].filter(Boolean).join(", ") || "None";
  return (
    <div className="flex h-full flex-col bg-(--bg)">
      <AppBar bank={bank} top={top} title="Spending insights" />
      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-(--b)/12 text-(--ink)">
            <Icon icon={CheckmarkCircle02Icon} className="size-6" strokeWidth={2} />
          </span>
          <p className="mt-3 text-[16px] font-semibold tracking-[-0.02em] text-(--tx)">Plan saved</p>
          <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-(--mu)">
            You could keep {fmtWhole(c.monthly)} a month, about {fmtWhole(c.yearly)} a year.
          </p>
        </div>
        <dl data-sim="saved-card" className="mt-2 divide-y divide-(--ln) rounded-2xl bg-(--card) px-3.5 text-[11px]">
          {[
            ["Protected", protectedList],
            ["Cut", `${c.category}, ${c.percent}%`],
            ["New monthly spend", fmtWhole(c.result)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2.5">
              <dt className="text-(--mu)">{k}</dt>
              <dd className="text-right font-medium text-(--tx)">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-[14px] border border-(--ln) py-3 text-center text-[12.5px] font-semibold text-(--ink)">
          Turn it into a savings goal
        </div>
        <PoweredBy />
      </div>
    </div>
  );
}

export function BankAppScreen({
  bank,
  screen,
  state,
  top,
}: {
  bank: BankApp;
  screen: SimScreen;
  state: SimState;
  /** Height of the status bar area, which differs per device. */
  top: number;
}) {
  switch (screen) {
    case "home":
      if (bank.layout === "classic") return <HomeClassic bank={bank} top={top} />;
      if (bank.layout === "dark") return <HomeDark bank={bank} top={top} />;
      return <HomeCard bank={bank} top={top} />;
    case "overview":
      return <Overview bank={bank} top={top} />;
    case "protect":
      return <Protect bank={bank} top={top} state={state} />;
    case "plan":
      return <Plan bank={bank} top={top} state={state} />;
    case "saved":
      return <Saved bank={bank} top={top} state={state} />;
  }
}
