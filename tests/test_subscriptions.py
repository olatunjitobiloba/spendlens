"""Tests for ai.subscriptions: agentic subscription detection and cancellation metadata."""

import pytest

from ai.subscriptions import scan_subscriptions, SubscriptionItem


def test_scan_subscriptions_detects_known_merchants():
    txns = [
        # Netflix repeats 3 times monthly
        {"amount_kobo": 450000, "direction": "debit", "date": "2026-08-01", "description": "NETFLIX.COM PAYMENT"},
        {"amount_kobo": 450000, "direction": "debit", "date": "2026-09-01", "description": "NETFLIX.COM PAYMENT"},
        {"amount_kobo": 450000, "direction": "debit", "date": "2026-10-01", "description": "NETFLIX.COM PAYMENT"},
        # Spotify repeats 3 times
        {"amount_kobo": 90000, "direction": "debit", "date": "2026-08-15", "description": "SPOTIFY PREMIUM AB"},
        {"amount_kobo": 90000, "direction": "debit", "date": "2026-09-15", "description": "SPOTIFY PREMIUM AB"},
        {"amount_kobo": 90000, "direction": "debit", "date": "2026-10-15", "description": "SPOTIFY PREMIUM AB"},
    ]
    subs = scan_subscriptions(txns)
    assert len(subs) >= 2
    netflix = next(s for s in subs if "netflix" in s.merchant.lower())
    assert netflix.monthly_kobo == 450000
    assert netflix.annual_kobo == 450000 * 12
    assert netflix.cancellation_url is not None
    assert "netflix.com" in netflix.cancellation_url
    assert "cancel" in netflix.cancellation_email_template.lower()
