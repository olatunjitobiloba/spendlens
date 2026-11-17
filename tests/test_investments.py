"""Tests for ai.investments: goal-based investment opportunities and compound return projection."""

import pytest

from ai.investments import suggest_investments, project_investment_growth, InvestmentOption


def test_suggest_investments_short_term():
    # User has ₦30,000 monthly savings capacity, goal horizon is 4 months (emergency/short term)
    monthly_kobo = 3000000
    options = suggest_investments(monthly_spare_kobo=monthly_kobo, horizon_months=4)
    assert len(options) >= 2
    # Should recommend low risk MMF or Treasury Bills
    assert any("money market" in o.title.lower() for o in options)
    for opt in options:
        assert opt.projected_growth_kobo > opt.total_invested_kobo
        assert opt.net_gain_kobo > 0


def test_suggest_investments_medium_and_long_term():
    # 18 months horizon
    options_med = suggest_investments(monthly_spare_kobo=5000000, horizon_months=18)
    assert any("fgn" in o.title.lower() or "bond" in o.title.lower() for o in options_med)

    # 36 months horizon (long term)
    options_long = suggest_investments(monthly_spare_kobo=10000000, horizon_months=36)
    assert any("dollar" in o.title.lower() or "equity" in o.title.lower() for o in options_long)


def test_project_investment_growth():
    # ₦50,000/month saved for 12 months at 15% p.a.
    res = project_investment_growth(monthly_kobo=5000000, months=12, annual_rate_pct=15.0)
    assert res.total_principal_kobo == 5000000 * 12  # ₦600,000
    assert res.total_future_value_kobo > res.total_principal_kobo
    assert res.gain_kobo > 0
