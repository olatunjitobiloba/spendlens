"""Tests for ai.habits: habit timing, emotional/impulse spend detection."""

from datetime import datetime, timezone
import pytest

from ai.habits import analyze_habits, HabitAudit


def test_analyze_habits_empty():
    audit = analyze_habits([])
    assert isinstance(audit, HabitAudit)
    assert audit.total_analyzed_txns == 0
    assert audit.late_night_kobo == 0
    assert audit.weekend_surge_percentage == 0.0


def test_analyze_habits_detects_late_night_spend():
    # 2 transactions at 11:30 PM (23:30) and 1:00 AM (01:00)
    txns = [
        {
            "amount_kobo": 1500000,  # 15,000 NGN
            "direction": "debit",
            "category": "Food & Dining",
            "timestamp": "2026-11-10T23:30:00Z",
            "description": "Late Night Shawarma Lekki",
        },
        {
            "amount_kobo": 2500000,  # 25,000 NGN
            "direction": "debit",
            "category": "Entertainment",
            "timestamp": "2026-11-11T01:15:00Z",
            "description": "Club Lounge VI",
        },
        {
            "amount_kobo": 1000000,  # 10,000 NGN daytime
            "direction": "debit",
            "category": "Food & Dining",
            "timestamp": "2026-11-11T13:00:00Z",
            "description": "Lunch Canteen",
        },
    ]
    audit = analyze_habits(txns)
    assert audit.late_night_kobo == 4000000  # 40,000 NGN
    assert audit.late_night_count == 2
    assert any("late-night" in w.lower() for w in audit.warnings)


def test_analyze_habits_detects_weekend_surge():
    # Friday, Saturday, Sunday vs Monday
    # 2026-11-13 is Friday, 2026-11-14 is Saturday, 2026-11-09 is Monday
    txns = [
        {"amount_kobo": 3000000, "direction": "debit", "timestamp": "2026-11-13T20:00:00Z", "description": "Fri outing"},
        {"amount_kobo": 4000000, "direction": "debit", "timestamp": "2026-11-14T19:00:00Z", "description": "Sat party"},
        {"amount_kobo": 1000000, "direction": "debit", "timestamp": "2026-11-09T12:00:00Z", "description": "Mon groceries"},
    ]
    audit = analyze_habits(txns)
    # Total debit = 80,000 NGN, weekend = 70,000 NGN (87.5%)
    assert audit.weekend_surge_percentage > 80.0
    assert any("weekend" in w.lower() for w in audit.warnings)
