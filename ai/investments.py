"""Goal-based investment opportunity matching and compound return projections.

Matches spare monthly savings against legitimate Nigerian asset classes (Money Market Funds,
Treasury Bills, FGN Savings Bonds) with zero external API fees and clear regulatory disclaimers.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class InvestmentOption:
    title: str
    asset_class: str
    benchmark_annual_rate_pct: float
    risk_level: Literal["Very Low", "Low", "Moderate", "High"]
    minimum_monthly_kobo: int
    horizon_label: str
    projected_growth_kobo: int
    total_invested_kobo: int
    net_gain_kobo: int
    description: str
    regulatory_body: str


@dataclass(frozen=True)
class InvestmentProjection:
    total_principal_kobo: int
    total_future_value_kobo: int
    gain_kobo: int
    annual_rate_pct: float
    months: int


def project_investment_growth(
    monthly_kobo: int,
    months: int,
    annual_rate_pct: float,
) -> InvestmentProjection:
    """Calculates compound future value of recurring monthly contributions."""
    if monthly_kobo <= 0 or months <= 0:
        return InvestmentProjection(
            total_principal_kobo=0,
            total_future_value_kobo=0,
            gain_kobo=0,
            annual_rate_pct=annual_rate_pct,
            months=months,
        )

    monthly_rate = (annual_rate_pct / 100.0) / 12.0
    future_value = 0.0

    # Monthly compounding with monthly addition
    for _ in range(months):
        future_value = (future_value + monthly_kobo) * (1.0 + monthly_rate)

    total_principal = monthly_kobo * months
    future_value_kobo = round(future_value)
    gain_kobo = max(0, future_value_kobo - total_principal)

    return InvestmentProjection(
        total_principal_kobo=total_principal,
        total_future_value_kobo=future_value_kobo,
        gain_kobo=gain_kobo,
        annual_rate_pct=annual_rate_pct,
        months=months,
    )


def suggest_investments(
    monthly_spare_kobo: int,
    horizon_months: int = 12,
) -> list[InvestmentOption]:
    """Recommends investment asset classes suited to the user's spare monthly savings and timeframe."""
    effective_kobo = max(1000000, monthly_spare_kobo)  # Min benchmark: ₦10,000/mo
    options: list[InvestmentOption] = []

    # 1. Short-Term (< 6 months) or foundational liquidity: Money Market Fund (MMF)
    mmf_proj = project_investment_growth(effective_kobo, horizon_months, annual_rate_pct=16.5)
    options.append(
        InvestmentOption(
            title="Money Market Mutual Fund (MMF)",
            asset_class="Money Market",
            benchmark_annual_rate_pct=16.5,
            risk_level="Low",
            minimum_monthly_kobo=500000,  # ₦5,000
            horizon_label="Liquid / Short-term (1 - 6 months)",
            projected_growth_kobo=mmf_proj.total_future_value_kobo,
            total_invested_kobo=mmf_proj.total_principal_kobo,
            net_gain_kobo=mmf_proj.gain_kobo,
            description=(
                "Invests in short-term bank deposits and government securities. "
                "Offers high liquidity (withdraw within 24-48 hours) with yields significantly higher than bank savings."
            ),
            regulatory_body="Securities and Exchange Commission (SEC Nigeria)",
        )
    )

    # 2. Government Backed: Nigerian Treasury Bills (T-Bills)
    tbill_proj = project_investment_growth(effective_kobo, horizon_months, annual_rate_pct=19.0)
    options.append(
        InvestmentOption(
            title="Nigerian Treasury Bills (T-Bills)",
            asset_class="Sovereign Debt",
            benchmark_annual_rate_pct=19.0,
            risk_level="Very Low",
            minimum_monthly_kobo=10000000,  # ₦100,000 typical minimum batch
            horizon_label="Fixed Horizon (91, 182, or 364 days)",
            projected_growth_kobo=tbill_proj.total_future_value_kobo,
            total_invested_kobo=tbill_proj.total_principal_kobo,
            net_gain_kobo=tbill_proj.gain_kobo,
            description=(
                "Direct credit backed by the Federal Government of Nigeria and Central Bank of Nigeria. "
                "Zero default risk, interest paid upfront at auction."
            ),
            regulatory_body="Debt Management Office (DMO) / CBN",
        )
    )

    # 3. Medium-Term (6-24 months): FGN Savings Bond (FGNSB)
    if horizon_months >= 6:
        fgn_proj = project_investment_growth(effective_kobo, horizon_months, annual_rate_pct=17.5)
        options.append(
            InvestmentOption(
                title="FGN Savings Bond (FGNSB)",
                asset_class="Retail Sovereign Bond",
                benchmark_annual_rate_pct=17.5,
                risk_level="Very Low",
                minimum_monthly_kobo=1000000,  # ₦10,000
                horizon_label="Medium-term (2 - 3 years, quarterly coupon)",
                projected_growth_kobo=fgn_proj.total_future_value_kobo,
                total_invested_kobo=fgn_proj.total_principal_kobo,
                net_gain_kobo=fgn_proj.gain_kobo,
                description=(
                    "Targeted retail bond issued monthly by the Debt Management Office. "
                    "Pays guaranteed quarterly coupon payments directly into your bank account."
                ),
                regulatory_body="Debt Management Office (DMO)",
            )
        )

    # 4. Long-Term (> 24 months): Dollar Hedge / Equity Index Fund
    if horizon_months >= 24:
        dollar_proj = project_investment_growth(effective_kobo, horizon_months, annual_rate_pct=8.0)
        options.append(
            InvestmentOption(
                title="US Dollar Fixed Income Mutual Fund",
                asset_class="Foreign Currency Hedging",
                benchmark_annual_rate_pct=8.0,
                risk_level="Moderate",
                minimum_monthly_kobo=5000000,  # ~$30+ equivalent
                horizon_label="Long-term (2+ years)",
                projected_growth_kobo=dollar_proj.total_future_value_kobo,
                total_invested_kobo=dollar_proj.total_principal_kobo,
                net_gain_kobo=dollar_proj.gain_kobo,
                description=(
                    "Invests in US Dollar Eurobonds and foreign sovereign notes. "
                    "Protects purchasing power against Naira currency depreciation."
                ),
                regulatory_body="Securities and Exchange Commission (SEC Nigeria)",
            )
        )

    return options
