"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert02Icon,
  Analytics01Icon,
  Calendar03Icon,
  Coins01Icon,
  Copy01Icon,
  LinkSquare02Icon,
  Moon02Icon,
  PiggyBankIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError } from "@/components/ui/field-error";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatTile } from "@/components/ui/stat-tile";
import { showToast } from "@/components/ui/toast";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import { useSavedScenarios } from "@/lib/plan";
import type { SubscriptionItem } from "@/types/api";
import { cn } from "@/utils/cn";
import { fmtWhole } from "@/utils/format";
import { MAX_TARGET_KOBO, parseNairaToKobo } from "@/utils/goal";
import { ErrorNotice } from "../shared/error-notice";
import { RowsSkeleton, SectionSkeleton } from "../skeletons";

// ---------- Habits: GET /v1/habits ----------

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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Weekend spending"
          icon={Calendar03Icon}
          value={<Money kobo={h.weekend_kobo} className="font-sans" />}
          caption={`${h.weekend_surge_percentage}% of spending · Fri to Sun`}
        />
        <StatTile
          label="Late at night"
          icon={Moon02Icon}
          value={<Money kobo={h.late_night_kobo} className="font-sans" />}
          caption={`${h.late_night_count} payment${h.late_night_count === 1 ? "" : "s"}, 10 PM to 4:30 AM`}
        />
        <StatTile
          label="Small drains"
          icon={Coins01Icon}
          value={<Money kobo={h.micro_drain_kobo} className="font-sans" />}
          caption={`${h.micro_drain_count} debits of ₦2,500 or less`}
        />
        <StatTile
          label="Looked at"
          icon={Analytics01Icon}
          value={h.total_analyzed_txns.toLocaleString("en-NG")}
          caption="Debit transactions"
        />
      </div>

      <Section title="What stands out">
        {h.warnings.length === 0 ? (
          <p className="text-[13.5px] text-t3">Nothing unusual. Your spending is spread evenly across the week.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <ul className="space-y-2.5">
              {h.warnings.map((w) => (
                <li key={w} className="flex gap-2.5 text-[13.5px] leading-relaxed text-t2">
                  <Icon icon={Alert02Icon} className="mt-0.5 text-warn" />
                  {w}
                </li>
              ))}
            </ul>
            <ul className="space-y-2.5">
              {h.actionable_cuts.map((c) => (
                <li key={c} className="flex gap-2.5 text-[13.5px] leading-relaxed text-t2">
                  <Icon icon={Tick02Icon} className="mt-0.5 text-positive" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
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

async function copyEmail(s: SubscriptionItem) {
  try {
    await navigator.clipboard.writeText(s.cancellation_email_template);
    showToast({ tone: "positive", title: "Cancellation email copied", description: `Paste it into an email to ${s.merchant}.` });
  } catch {
    showToast({ tone: "danger", title: "Couldn't copy the email", description: "Your browser blocked the clipboard." });
  }
}

function Subscriptions() {
  const subs = useResource(() => api.insights.subscriptions(), "subscriptions");
  const body = subs.error ? (
    <ErrorNotice error={subs.error} onRetry={subs.reload} />
  ) : !subs.data ? (
    <RowsSkeleton rows={3} />
  ) : subs.data.length === 0 ? (
    <p className="text-[13.5px] text-t3">No repeat charges found. They show up after three or more matching payments.</p>
  ) : (
    <ul className="divide-y divide-line">
      {subs.data.map((s) => {
        const url = safeCancelUrl(s.cancellation_url);
        return (
          <li key={`${s.merchant}-${s.frequency_days}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">{s.merchant}</span>
              <span className="text-[12.5px] text-t3">
                {every(s.frequency_days)} · <Money kobo={s.annual_kobo} className="font-sans" /> a year
              </span>
            </span>
            <span className="text-right text-[14px] font-[600]">
              <Money kobo={s.monthly_kobo} className="font-sans" />
              <span className="block text-[11.5px] font-normal text-t4">a month</span>
            </span>
            <span className="flex gap-1.5">
              {url && (
                <Button asChild size="sm" variant="outline">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon icon={LinkSquare02Icon} />
                    Cancel online
                  </a>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => void copyEmail(s)}>
                <Icon icon={Copy01Icon} />
                Copy email
              </Button>
            </span>
          </li>
        );
      })}
    </ul>
  );

  const total = subs.data?.reduce((sum, s) => sum + s.monthly_kobo, 0) ?? 0;
  return (
    <Section
      title="Subscriptions"
      description="Charges that repeat on a steady schedule, with a quick way out."
      aside={
        subs.data && subs.data.length > 0 ? (
          <span className="text-[13px] text-t3">
            <Money kobo={total} className="font-sans font-[600] text-foreground" /> a month
          </span>
        ) : undefined
      }
    >
      {body}
    </Section>
  );
}

// ---------- Investments: GET /v1/investments/suggestions ----------

const HORIZONS = [6, 12, 24, 36] as const;
const DEFAULT_SPARE_KOBO = 2_000_000; // ₦20,000
const INPUT_ID = "spare-amount";

function Investments() {
  const saved = useSavedScenarios();
  // Start from the most recent saved plan's monthly saving, if there is one.
  const start = saved[0]?.total_reduction_kobo || DEFAULT_SPARE_KOBO;
  const [amount, setAmount] = useState(String(start / 100));
  const [horizon, setHorizon] = useState<number>(12);
  const [query, setQuery] = useState({ spare: start, horizon: 12 });
  const [inputError, setInputError] = useState<string | null>(null);

  const options = useResource(
    () => api.insights.investmentSuggestions({ monthly_spare_kobo: query.spare, horizon_months: query.horizon }),
    `invest|${query.spare}|${query.horizon}`,
  );
  const apiField = options.error?.field("monthly_spare_kobo") ?? options.error?.field("horizon_months");
  const fieldMessage = inputError ?? apiField ?? null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const kobo = parseNairaToKobo(amount);
    if (kobo === null) return setInputError("Use an amount like 20000 or 20,000.50.");
    if (kobo > MAX_TARGET_KOBO) return setInputError(`The most you can enter is ${fmtWhole(MAX_TARGET_KOBO)}.`);
    setInputError(null);
    setQuery({ spare: kobo, horizon });
  }

  return (
    <Section
      title="Grow what you save"
      description="Regulated Nigerian options for the money a cut frees up. Benchmarks, not promises, and not financial advice."
    >
      <form onSubmit={submit} className="flex flex-wrap items-start gap-3" noValidate>
        <div className="w-full sm:w-52">
          <label htmlFor={INPUT_ID} className="text-[12.5px] text-t3">
            Each month
          </label>
          <span className="relative mt-1 block">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-t3">
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
              className={cn(
                "h-9 w-full rounded-xl border bg-panel pr-3 pl-7 text-[13px] tabular-nums",
                fieldMessage ? "border-destructive" : "border-line-strong",
              )}
            />
          </span>
          <FieldError id={`${INPUT_ID}-err`}>{fieldMessage}</FieldError>
        </div>
        <fieldset>
          <legend className="text-[12.5px] text-t3">For</legend>
          <div className="mt-1 flex gap-1 rounded-lg border border-line bg-panel-raised/60 p-1">
            {HORIZONS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={horizon === m}
                onClick={() => setHorizon(m)}
                className={cn(
                  "h-7 rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
                  horizon === m ? "border border-line-strong bg-panel text-foreground shadow-sm" : "text-t3 hover:text-foreground",
                )}
              >
                {m} months
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" variant="outline" className="mt-[22px]">
          <Icon icon={PiggyBankIcon} />
          Show options
        </Button>
      </form>

      <div className="mt-5">
        {options.error ? (
          // A rejected amount is already shown under the input.
          apiField ? null : <ErrorNotice error={options.error} onRetry={options.reload} />
        ) : !options.data || options.loading ? (
          <RowsSkeleton rows={3} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {options.data.map((o) => (
              <li key={o.title} className="flex flex-col rounded-2xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-[600]">{o.title}</p>
                    <p className="text-[12.5px] text-t3">
                      {o.asset_class} · {o.risk_level} risk
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[17px] font-[650] tabular-nums">
                    {o.benchmark_annual_rate_pct}%
                    <span className="block text-[11px] font-normal text-t4">a year</span>
                  </p>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-t2">{o.description}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[12.5px]">
                  <div>
                    <dt className="text-t4">You put in</dt>
                    <dd className="font-medium">
                      <Money kobo={o.total_invested_kobo} className="font-sans" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-t4">Could grow to</dt>
                    <dd className="font-medium">
                      <Money kobo={o.projected_growth_kobo} className="font-sans" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-t4">Gain</dt>
                    <dd className="font-medium text-positive">
                      <Money kobo={o.net_gain_kobo} className="font-sans" />
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11.5px] text-t4">
                  {o.horizon_label} · from <Money kobo={o.minimum_monthly_kobo} className="font-sans" /> · {o.regulatory_body}
                </p>
              </li>
            ))}
          </ul>
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
