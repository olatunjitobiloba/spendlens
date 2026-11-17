"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api";
import type { InvestmentOption } from "@/types/api";
import { fmtWhole } from "@/utils/format";
import { ErrorNotice } from "../shared/error-notice";

const HORIZONS = [
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
  { label: "3 Years", months: 36 },
  { label: "5 Years", months: 60 },
];

function AssetCard({ asset, monthlyKobo }: { asset: InvestmentOption; monthlyKobo: number }) {
  const annualRate = asset.benchmark_annual_rate_pct;
  const monthlyRate = annualRate / 100 / 12;

  // 1-year compound return projection
  const { totalInvested, fv, gain } = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < 12; i++) {
      acc = (acc + monthlyKobo) * (1 + monthlyRate);
    }
    const invested = monthlyKobo * 12;
    const futureVal = Math.round(acc);
    return {
      totalInvested: invested,
      fv: futureVal,
      gain: Math.max(0, futureVal - invested),
    };
  }, [monthlyKobo, monthlyRate]);

  return (
    <div className="flex flex-col justify-between rounded-[1.25rem] border border-line bg-panel p-5 transition-all">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-t2">
              {asset.asset_class}
            </span>
            <h3 className="mt-2 text-[16px] font-[650] tracking-[-0.01em]">{asset.title}</h3>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[12px] font-[650] text-emerald-600">
            ~{asset.benchmark_annual_rate_pct}% p.a.
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-t3">{asset.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line/60 pt-3 text-[12.5px]">
          <div>
            <span className="text-t3">Risk profile:</span>
            <p className="font-medium text-foreground">{asset.risk_level}</p>
          </div>
          <div>
            <span className="text-t3">Horizon / Terms:</span>
            <p className="font-medium text-foreground">{asset.horizon_label}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line/60 bg-foreground/[0.02] p-3.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-t3">1-Year projected value:</span>
          <span className="font-[650] text-emerald-600">{fmtWhole(fv)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-t4">
          <span>Principal: {fmtWhole(totalInvested)}</span>
          <span>Gain: +{fmtWhole(gain)}</span>
        </div>
        <div className="mt-2 text-[10.5px] text-t4">Regulated by: {asset.regulatory_body}</div>
      </div>
    </div>
  );
}

export function InvestmentsScreen() {
  const [monthlyNaira, setMonthlyNaira] = useState(25_000);
  const [horizonMonths, setHorizonMonths] = useState(12);

  const monthlyKobo = monthlyNaira * 100;
  const suggestions = useResource(
    () => api.investmentSuggestions({ spare_monthly_kobo: monthlyKobo }),
    `investments-${monthlyKobo}`,
  );

  // Live calculator calculation
  const benchmarkRate = 19.5; // Average Nigerian MMF / Sovereign rate
  const monthlyRate = benchmarkRate / 100 / 12;

  const { totalPrincipalKobo, futureValueKobo, netGainKobo } = useMemo(() => {
    let fv = 0;
    for (let i = 0; i < horizonMonths; i++) {
      fv = (fv + monthlyKobo) * (1 + monthlyRate);
    }
    const principal = monthlyKobo * horizonMonths;
    const roundedFv = Math.round(fv);
    return {
      totalPrincipalKobo: principal,
      futureValueKobo: roundedFv,
      netGainKobo: Math.max(0, roundedFv - principal),
    };
  }, [monthlyKobo, horizonMonths, monthlyRate]);

  if (suggestions.error) {
    return <ErrorNotice error={suggestions.error} onRetry={suggestions.reload} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investment Opportunities"
        description="Match spare savings to legitimate, SEC & DMO regulated Nigerian asset classes with compound future-value projections."
        aside={
          <Button asChild variant="outline" size="sm">
            <Link href="/insights/chat">
              Discuss with AI Advisor
              <Icon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {/* Interactive Compound Calculator Section */}
      <Section
        title="Compound Future-Value Simulator"
        description="See what happens when you redirect monthly impulse cuts into regulated high-yield Nigerian instruments."
      >
        <div className="grid gap-6 md:grid-cols-12">
          {/* Controls */}
          <div className="space-y-4 md:col-span-5">
            <div>
              <label htmlFor="monthly-saving" className="block text-[13px] font-medium text-t2">
                Monthly Savings Contribution: <span className="font-semibold text-foreground">₦{monthlyNaira.toLocaleString()}</span>
              </label>
              <input
                id="monthly-saving"
                type="range"
                min={5_000}
                max={200_000}
                step={5_000}
                value={monthlyNaira}
                onChange={(e) => setMonthlyNaira(Number(e.target.value))}
                className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-foreground/10 accent-brand"
              />
              <div className="mt-1 flex justify-between text-[11px] text-t4">
                <span>₦5,000/mo</span>
                <span>₦100,000/mo</span>
                <span>₦200,000/mo</span>
              </div>
            </div>

            <div>
              <span className="block text-[13px] font-medium text-t2">Investment Horizon</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {HORIZONS.map((h) => (
                  <button
                    key={h.months}
                    type="button"
                    onClick={() => setHorizonMonths(h.months)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                      horizonMonths === h.months
                        ? "bg-brand text-white shadow-sm"
                        : "bg-foreground/[0.05] text-t2 hover:bg-foreground/[0.08]"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="flex flex-col justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 md:col-span-7">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">
              <Icon icon={SparklesIcon} className="size-3.5" />
              Projected Portfolio Outcome
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[32px] font-[750] tracking-tight text-foreground">
                {fmtWhole(futureValueKobo)}
              </span>
              <span className="text-[13px] font-medium text-emerald-600">
                (+{fmtWhole(netGainKobo)} profit)
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-500/15 pt-3 text-[12.5px]">
              <div>
                <span className="text-t3">Total Out-of-Pocket Invested:</span>
                <p className="font-semibold text-foreground">{fmtWhole(totalPrincipalKobo)}</p>
              </div>
              <div>
                <span className="text-t3">Benchmark Annual Rate:</span>
                <p className="font-semibold text-foreground">~{benchmarkRate}% p.a. (compounding monthly)</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Regulated Asset Opportunities Bento Grid */}
      <Section
        title="Regulated Nigerian Asset Classes"
        description="SEC and DMO authorized investment vehicles to allocate your monthly savings."
      >
        {!suggestions.data ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
            <div className="h-56 animate-pulse rounded-2xl bg-foreground/5" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestions.data.map((asset, i) => (
              <AssetCard key={i} asset={asset} monthlyKobo={monthlyKobo} />
            ))}
          </div>
        )}
      </Section>

      {/* Legal & Regulatory Safeguard Notice */}
      <Notice tone="neutral" title="Regulatory Notice & Disclaimers">
        Projections use indicative benchmark rates from official Nigerian sovereign and institutional yield curves. SpendLens is an educational budgeting and intelligence system, not a licensed broker or asset manager. We never hold client funds. Past performance does not guarantee future yields.
      </Notice>
    </div>
  );
}
