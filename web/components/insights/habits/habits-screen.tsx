"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert02Icon,
  ArrowRight01Icon,
  Coins01Icon,
  Copy01Icon,
  InformationCircleIcon,
  LinkSquare02Icon,
  Moon02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError } from "@/components/ui/field-error";
import { Hint } from "@/components/ui/hint";
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Status } from "@/components/ui/status";
import { showToast } from "@/components/ui/toast";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useSavedScenarios } from "@/lib/plan";
import type { HabitAudit, InvestmentOption, SubscriptionItem } from "@/types/api";
import { cn } from "@/utils/cn";
import { fmtWhole } from "@/utils/format";
import { MAX_TARGET_KOBO, parseNairaToKobo } from "@/utils/goal";
import { ErrorNotice } from "../shared/error-notice";
import { RowsSkeleton, SectionSkeleton } from "../skeletons";

const plural = (n: number, word: string) => `${n.toLocaleString("en-NG")} ${word}${n === 1 ? "" : "s"}`;

// ---------- Habits: GET /v1/habits ----------

/** Fri, Sat and Sun are 3 of 7 days: the share an even week would give them. */
const EVEN_WEEKEND_PCT = (3 / 7) * 100;

/** Weekend vs. weekday as one bar, with a tick where an even week would sit. */
function WeekRhythm({ h }: { h: HabitAudit }) {
  const weekend = Math.max(0, Math.min(100, h.weekend_surge_percentage));
  const heavy = weekend > EVEN_WEEKEND_PCT + 5;
  return (
    <div>
      <p className="text-[12.5px] text-t3">Friday to Sunday</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[32px] leading-none font-[650] tracking-[-0.03em] tabular-nums">{Math.round(weekend)}%</span>
        <span className="text-[13px] text-t3">of what you spend</span>
      </p>

      <div className="relative mt-6">
        <span aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-foreground/6">
          <span className="h-full rounded-l-full bg-brand" style={{ width: `${weekend}%` }} />
        </span>
        {/* Where an evenly spread week would land. */}
        <span
          aria-hidden="true"
          className="absolute -top-1.5 h-6 w-px bg-foreground/40"
          style={{ left: `${EVEN_WEEKEND_PCT}%` }}
        />
        <span
          className="absolute top-6 -translate-x-1/2 text-[11px] whitespace-nowrap text-t4"
          style={{ left: `${EVEN_WEEKEND_PCT}%` }}
        >
          Even week · 43%
        </span>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-3 text-[12.5px]">
        <div>
          <dt className="flex items-center gap-1.5 text-t3">
            <span className="size-2 rounded-full bg-brand" />
            Fri – Sun
          </dt>
          <dd className="mt-1 text-[14px] font-semibold">
            <Money kobo={h.weekend_kobo} className="font-sans" />
          </dd>
          <dd className="text-t4">{plural(h.weekend_count, "payment")}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-t3">
            <span className="size-2 rounded-full bg-foreground/15" />
            Mon – Thu
          </dt>
          <dd className="mt-1 text-[14px] font-semibold">{Math.round(100 - weekend)}%</dd>
          <dd className="text-t4">{plural(h.total_analyzed_txns - h.weekend_count, "payment")}</dd>
        </div>
      </dl>
      <p className="mt-4 text-[12.5px] text-t3">
        {heavy
          ? "Your weekends carry more than their share of the week."
          : "Your spending is spread fairly evenly across the week."}
      </p>
    </div>
  );
}

/** A small habit figure with its icon tile, used down the right of the rhythm panel. */
function HabitFigure({
  icon,
  label,
  kobo,
  caption,
}: {
  icon: IconSvgElement;
  label: string;
  kobo: number;
  caption: string;
}) {
  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon icon={icon} className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-t3">{label}</p>
        <p className={cn("mt-0.5 text-[17px] font-semibold tracking-[-0.02em]", !kobo && "text-t4")}>
          <Money kobo={kobo} className="font-sans" />
        </p>
        <p className="text-[12px] text-t4">{caption}</p>
      </div>
    </div>
  );
}

/** Each warning paired with the cut the API suggests for it. */
function Findings({ h }: { h: HabitAudit }) {
  if (h.warnings.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-panel-raised/50 px-4 py-3.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon icon={Tick02Icon} className="size-4" />
        </span>
        <p className="text-[13.5px] text-t2">Nothing unusual stands out. Keep an eye on this page after your next import.</p>
      </div>
    );
  }
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {h.warnings.map((w, i) => (
        <li key={w} className="flex flex-col rounded-2xl border border-line bg-panel-raised/40 p-4">
          <p className="flex gap-2.5 text-[13.5px] leading-relaxed text-t2">
            <Icon icon={Alert02Icon} className="mt-0.5 shrink-0 text-warn" />
            {w}
          </p>
          {h.actionable_cuts[i] && (
            <p className="mt-3 flex gap-2.5 border-t border-line pt-3 text-[13px] leading-relaxed text-t3">
              <Icon icon={ArrowRight01Icon} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <span className="font-medium text-foreground">Try this:</span> {h.actionable_cuts[i]}
              </span>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function Habits() {
  const habits = useResource(() => api.insights.habits(), "habits");
  if (habits.error) return <ErrorNotice error={habits.error} onRetry={habits.reload} />;
  if (!habits.data) return <SectionSkeleton rows={3} />;
  const h = habits.data;

  if (!h.total_analyzed_txns) {
    return (
      <EmptyState
        title="No spending to look at yet"
        action={
          <Button asChild>
            <Link href="/insights/import">Import transactions</Link>
          </Button>
        }
      >
        Habits are worked out from your debits once you import a statement.
      </EmptyState>
    );
  }

  return (
    <Section
      title="When you spend"
      description={`Patterns across ${plural(h.total_analyzed_txns, "debit")}.`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
        <WeekRhythm h={h} />
        <div className="divide-y divide-line border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <HabitFigure
            icon={Coins01Icon}
            label="Small drains"
            kobo={h.micro_drain_kobo}
            caption={`${plural(h.micro_drain_count, "debit")} of ₦2,500 or less`}
          />
          <HabitFigure
            icon={Moon02Icon}
            label="Late at night"
            kobo={h.late_night_kobo}
            caption={
              h.late_night_count
                ? `${plural(h.late_night_count, "payment")}, 10 PM to 4:30 AM`
                : "None between 10 PM and 4:30 AM"
            }
          />
        </div>
      </div>

      <h3 className="mt-7 mb-3 text-[13px] font-semibold">What stands out</h3>
      <Findings h={h} />
    </Section>
  );
}

// ---------- Subscriptions: GET /v1/subscriptions ----------

/** Only web and mail links from the API become clickable. */
function safeCancelUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "mailto:" ? u.href : null;
  } catch {
    return null;
  }
}

function every(days: number) {
  if (days === 7) return "Weekly";
  if (days === 14) return "Every 2 weeks";
  if (days === 30) return "Monthly";
  return `Every ${days} days`;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

async function copyEmail(s: SubscriptionItem) {
  try {
    await navigator.clipboard.writeText(s.cancellation_email_template);
    showToast({ tone: "positive", title: "Cancellation email copied", description: `Paste it into an email to ${s.merchant}.` });
  } catch {
    showToast({ tone: "danger", title: "Couldn't copy the email", description: "Your browser blocked the clipboard." });
  }
}

function SubscriptionRow({ s }: { s: SubscriptionItem }) {
  const url = safeCancelUrl(s.cancellation_url);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3.5 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel-raised text-[13px] font-[650] text-t2"
      >
        {initials(s.merchant)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium">{s.merchant}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-t4">
          <Status tone="neutral" className="h-5 px-2 text-[11px]">
            {every(s.frequency_days)}
          </Status>
          <span>
            <Money kobo={s.annual_kobo} className="font-sans" /> a year
          </span>
        </span>
      </span>
      <span className="text-right">
        <Money kobo={s.monthly_kobo} className="block font-sans text-[15px] font-semibold" />
        <span className="text-[11.5px] text-t4">a month</span>
      </span>
      <span className="flex w-full gap-1.5 sm:w-auto">
        {url && (
          <Button asChild size="sm" variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Icon icon={LinkSquare02Icon} />
              Cancel online
            </a>
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => void copyEmail(s)}>
          <Icon icon={Copy01Icon} />
          Cancellation email
        </Button>
      </span>
    </li>
  );
}

function Subscriptions() {
  const subs = useResource(() => api.insights.subscriptions(), "subscriptions");
  const list = subs.data ?? [];
  const monthly = list.reduce((sum, s) => sum + s.monthly_kobo, 0);
  const yearly = list.reduce((sum, s) => sum + s.annual_kobo, 0);

  return (
    <Section title="Subscriptions" description="Charges that repeat on a steady schedule, with a quick way out.">
      {subs.error ? (
        <ErrorNotice error={subs.error} onRetry={subs.reload} />
      ) : !subs.data ? (
        <RowsSkeleton rows={3} />
      ) : list.length === 0 ? (
        <p className="text-[13.5px] text-t3">No repeat charges found. They show up after three or more matching payments.</p>
      ) : (
        <div className="grid  lg:gap-8">
          <div className="rounded-2xl border border-line bg-panel-raised/40 p-4 self-start">
            <p className="text-[12.5px] text-t3">Together they cost</p>
            <p className="mt-1.5 text-[26px] leading-none font-[650] tracking-[-0.03em] tabular-nums">
              <Money kobo={yearly} className="font-sans" />
            </p>
            <p className="mt-1 text-[12.5px] text-t3">a year</p>
            <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-t3">
              <Money kobo={monthly} className="font-sans font-medium text-foreground" /> a month across{" "}
              {plural(list.length, "subscription")}.
            </p>
          </div>
          <ul className="divide-y divide-line">
            {list.map((s) => (
              <SubscriptionRow key={`${s.merchant}-${s.frequency_days}`} s={s} />
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

// ---------- Investments: GET /v1/investments/suggestions ----------

const HORIZONS = [6, 12, 24, 36] as const;
const DEFAULT_SPARE_KOBO = 2_000_000; // ₦20,000
const INPUT_ID = "spare-amount";

/** "Money Market Mutual Fund (MMF)" → "MMF"; titles without a short form stay as they are. */
const shortName = (title: string) => title.match(/\(([^)]+)\)\s*$/)?.[1] ?? title;

const compactNaira = (kobo: number) =>
  `₦${new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(kobo / 100)}`;

/**
 * Monthly deposits compounding at the benchmark rate, month by month. Only
 * draws the curve between the API's start and end values; the figures shown in
 * words are the API's own.
 */
function curve(o: InvestmentOption, months: number): number[] {
  const monthly = months > 0 ? o.total_invested_kobo / months : 0;
  const r = o.benchmark_annual_rate_pct / 100 / 12;
  const out = [0];
  let v = 0;
  for (let i = 0; i < months; i++) {
    v = (v + monthly) * (1 + r);
    out.push(v);
  }
  return out;
}

/**
 * The best option against the same money kept as cash. The options sit too
 * close to tell apart on one chart, so the cards carry each one's figures and
 * the chart shows the one thing that matters: the gap growth opens up.
 */
function GrowthChart({ best, months }: { best: InvestmentOption; months: number }) {
  const grown = curve(best, months);
  const cash = grown.map((_, i) => best.total_invested_kobo * (i / months));
  const top = Math.max(1, grown[grown.length - 1]);
  const W = 100;
  const H = 100;
  const x = (i: number) => (i / months) * W;
  const y = (v: number) => H - (v / top) * H;
  const line = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  // Area between the growth line and the cash line: the money growth adds.
  const gap = `${line(grown)} ${[...cash]
    .map((v, i) => [i, v] as const)
    .reverse()
    .map(([i, v]) => `L${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ")} Z`;
  const grid = [0.25, 0.5, 0.75, 1];
  const endCash = (y(cash[cash.length - 1]) / H) * 100;

  return (
    <figure className="rounded-2xl border border-line bg-panel-raised/40 p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[12.5px] text-t3">
            In {months} months with {shortName(best.title)}
          </p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
            <Money kobo={best.projected_growth_kobo} className="font-sans text-[26px] leading-none font-[650] tracking-[-0.03em]" />
            <span className="text-[13px] font-medium text-brand">
              +<Money kobo={best.net_gain_kobo} className="font-sans" /> more than cash
            </span>
          </p>
        </div>
        <ul className="flex gap-4 text-[12px] text-t3">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-brand" />
            {shortName(best.title)} at {best.benchmark_annual_rate_pct}%
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t-[1.5px] border-dashed border-t4" />
            Kept as cash
          </li>
        </ul>
      </figcaption>

      <div className="relative mt-6 pl-12">
        {/* Y axis labels in HTML so text stays crisp at any width. */}
        <div className="relative h-44 sm:h-52">
          {grid.map((g) => (
            <span
              key={g}
              className="absolute -left-12 w-10 -translate-y-1/2 text-right text-[10.5px] text-t4 tabular-nums"
              style={{ top: `${(1 - g) * 100}%` }}
            >
              {compactNaira(top * g)}
            </span>
          ))}
          {grid.map((g) => (
            <span
              key={g}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-line"
              style={{ top: `${(1 - g) * 100}%` }}
            />
          ))}
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-line-strong" />
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label={`${best.title} could grow to the amount shown after ${months} months, against the same money kept as cash`}
          >
            <defs>
              <linearGradient id="growth-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${line(grown)} L${W},${H} L0,${H} Z`} fill="url(#growth-fill)" />
            <path d={gap} fill="var(--brand)" fillOpacity="0.28" />
            <path
              d={line(cash)}
              fill="none"
              stroke="var(--t4)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line(grown)}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* End markers, in HTML so they stay round. */}
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 size-3 translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-[3px] ring-panel"
          />
          <span
            aria-hidden="true"
            className="absolute right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-t4 ring-2 ring-panel"
            style={{ top: `${endCash}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10.5px] text-t4">
          <span>Now</span>
          <span>{Math.round(months / 2)} months</span>
          <span>{months} months</span>
        </div>
      </div>
    </figure>
  );
}

/** "Nigerian Treasury Bills (T-Bills)" → "Nigerian Treasury Bills". */
const plainName = (title: string) => title.replace(/\s*\([^)]*\)\s*$/, "");

/**
 * One option, kept to what decides it: rate, risk, what it could grow to.
 * The long description and regulator sit behind the info button.
 */
function OptionCard({ o, best }: { o: InvestmentOption; best: boolean }) {
  const invested = o.projected_growth_kobo > 0 ? (o.total_invested_kobo / o.projected_growth_kobo) * 100 : 100;
  return (
    <li
      className={cn(
        "flex flex-col rounded-2xl border bg-panel p-5",
        best ? "border-brand/40 shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_8%,transparent)]" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Status tone={best ? "brand" : "neutral"}>{o.benchmark_annual_rate_pct}% a year</Status>
        <Hint
          label={
            <span className="block max-w-64 leading-relaxed font-normal">
              {o.description}
              <span className="mt-1.5 block opacity-70">Regulated by {o.regulatory_body}</span>
            </span>
          }
        >
          <button
            type="button"
            aria-label={`About ${plainName(o.title)}`}
            className="inline-flex size-7 items-center justify-center rounded-full text-t4 hover:bg-foreground/6 hover:text-foreground"
          >
            <Icon icon={InformationCircleIcon} className="size-4" />
          </button>
        </Hint>
      </div>

      <p className="mt-4 text-[14.5px] leading-snug font-semibold tracking-[-0.01em]">{plainName(o.title)}</p>
      <p className="mt-1 text-[12.5px] text-t3">{o.risk_level} risk</p>

      <div className="mt-auto pt-6">
        <p className="text-[12px] text-t4">Could grow to</p>
        <Money
          kobo={o.projected_growth_kobo}
          className="mt-1 block font-sans text-[22px] leading-none font-[650] tracking-[-0.03em]"
        />
        <span aria-hidden="true" className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-foreground/6">
          <span className="h-full bg-foreground/20" style={{ width: `${invested}%` }} />
          <span className="h-full rounded-r-full bg-brand" style={{ width: `${100 - invested}%` }} />
        </span>
        <p className="mt-2 text-[12px] font-medium text-brand">
          +<Money kobo={o.net_gain_kobo} className="font-sans" /> growth
        </p>
      </div>
    </li>
  );
}

function Investments() {
  const saved = useSavedScenarios();
  // Start from the most recent saved plan's monthly saving, if there is one.
  const start = saved[0]?.total_reduction_kobo || DEFAULT_SPARE_KOBO;
  const [amount, setAmount] = useState(String(start / 100));
  const [query, setQuery] = useState({ spare: start, horizon: 12 });
  const [inputError, setInputError] = useState<string | null>(null);

  const options = useResource(
    () => api.insights.investmentSuggestions({ monthly_spare_kobo: query.spare, horizon_months: query.horizon }),
    `invest|${query.spare}|${query.horizon}`,
  );
  const apiField = options.error?.field("monthly_spare_kobo") ?? options.error?.field("horizon_months");
  const fieldMessage = inputError ?? apiField ?? null;
  // Highest projected value first, so the chart's strongest line is the best case.
  const sorted = [...(options.data ?? [])].sort((a, b) => b.projected_growth_kobo - a.projected_growth_kobo);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const kobo = parseNairaToKobo(amount);
    if (kobo === null) return setInputError("Use an amount like 20000 or 20,000.50.");
    if (kobo > MAX_TARGET_KOBO) return setInputError(`The most you can enter is ${fmtWhole(MAX_TARGET_KOBO)}.`);
    setInputError(null);
    setQuery((q) => ({ ...q, spare: kobo }));
  }

  return (
    <Section
      title="Grow what you save"
      description="Regulated Nigerian options for the money a cut frees up. Benchmarks, not promises, and not financial advice."
    >
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3" noValidate>
        <div className="w-full sm:w-56">
          <label htmlFor={INPUT_ID} className="text-[12.5px] text-t3">
            Put aside each month
          </label>
          <span className="relative mt-1 flex">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[13px] text-t3">
              ₦
            </span>
            <input
              id={INPUT_ID}
              inputMode="decimal"
              value={amount}
              aria-invalid={Boolean(fieldMessage)}
              aria-describedby={fieldMessage ? `${INPUT_ID}-err` : undefined}
              onChange={(e) => {
                setAmount(e.target.value);
                setInputError(null);
              }}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              className={cn(
                "h-9 w-full rounded-full border bg-panel pr-3 pl-7 text-[13px] tabular-nums focus-visible:border-brand focus-visible:outline-none",
                fieldMessage ? "border-destructive" : "border-line-strong",
              )}
            />
          </span>
        </div>
        <fieldset>
          <legend className="text-[12.5px] text-t3">For</legend>
          <div className="mt-1 flex gap-1 rounded-full border border-line bg-panel-raised/60 p-1">
            {HORIZONS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={query.horizon === m}
                onClick={() => setQuery((q) => ({ ...q, horizon: m }))}
                className={cn(
                  "h-7 rounded-full px-3 text-[12.5px] font-medium transition-colors",
                  query.horizon === m ? "bg-panel text-foreground shadow-sm ring-1 ring-line-strong" : "text-t3 hover:text-foreground",
                )}
              >
                {m} months
              </button>
            ))}
          </div>
        </fieldset>
        {/* Enter or leaving the field applies the amount; this keeps a visible way to do it. */}
        <Button type="submit" variant="outline">
          Update
        </Button>
      </form>
      <FieldError id={`${INPUT_ID}-err`}>{fieldMessage}</FieldError>

      <div className="mt-5">
        {options.error ? (
          // A rejected amount is already shown under the input.
          apiField ? null : <ErrorNotice error={options.error} onRetry={options.reload} />
        ) : !options.data || options.loading ? (
          <RowsSkeleton rows={4} />
        ) : sorted.length === 0 ? (
          <p className="text-[13.5px] text-t3">No options fit that horizon. Try a longer one.</p>
        ) : (
          <div className="space-y-3">
            <GrowthChart best={sorted[0]} months={query.horizon} />
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {sorted.map((o, i) => (
                <OptionCard key={o.title} o={o} best={i === 0} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}

export function HabitsScreen() {
  return (
    <>
      <PageHeader
        title="Habits and subscriptions"
        description="When you spend, what keeps charging you, and where the money you save could go."
      />
      <div className="space-y-3">
        <Habits />
        <Subscriptions />
        <Investments />
      </div>
    </>
  );
}
