from dataclasses import dataclass
from ai.recurring import find_recurring, merchant_key


def tx(desc, amount, day, direction="debit"):
    return {
        "description": desc,
        "amount_kobo": amount,
        "date": day,
        "direction": direction,
    }


MONTHLY = [
    tx("StreamCo *1234 LAGOS", 450000, d)
    for d in ("2026-01-05", "2026-02-04", "2026-03-06")
]


def test_monthly_pattern_found():
    out = find_recurring(MONTHLY)
    assert len(out) == 1
    assert out[0]["period_days"] == 30 and out[0]["next_due"] == "2026-04-05"
    assert out[0]["occurrences"] == 3
    assert out[0]["amount_kobo"] == 450000
    assert out[0]["confidence"] == 0.8


def test_key_ignores_digits_and_case():
    assert merchant_key("StreamCo *1234 LAGOS") == merchant_key("STREAMCO 5678 LAGOS")


def test_two_occurrences_are_not_enough():
    assert find_recurring(MONTHLY[:2]) == []


def test_irregular_gaps_rejected():
    rows = [
        tx("Shop One", 100000, d)
        for d in ("2026-01-01", "2026-01-10", "2026-03-20")
    ]
    assert find_recurring(rows) == []


def test_credits_ignored():
    assert (
        find_recurring(
            [
                tx("Salary Co", 900000, d, "credit")
                for d in ("2026-01-25", "2026-02-25", "2026-03-25")
            ]
        )
        == []
    )


def test_same_day_duplicates_do_not_count_twice():
    rows = MONTHLY[:2] + [MONTHLY[1]]
    assert find_recurring(rows) == []


def test_weekly_pattern():
    rows = [
        tx("Bus Pass Weekly", 50000, d)
        for d in ("2026-01-01", "2026-01-08", "2026-01-15", "2026-01-22")
    ]
    res = find_recurring(rows)
    assert len(res) == 1
    assert res[0]["period_days"] == 7
    assert res[0]["next_due"] == "2026-01-29"


def test_biweekly_pattern():
    rows = [
        tx("Gym Membership", 250000, d)
        for d in ("2026-01-01", "2026-01-15", "2026-01-29")
    ]
    res = find_recurring(rows)
    assert len(res) == 1
    assert res[0]["period_days"] == 14
    assert res[0]["next_due"] == "2026-02-12"


def test_object_dataclass_support():
    @dataclass
    class TxnObj:
        description: str
        amount_kobo: int
        date: str
        direction: str

    rows = [
        TxnObj("Internet Sub", 1500000, d, "debit")
        for d in ("2026-01-01", "2026-01-31", "2026-03-02")
    ]
    res = find_recurring(rows)
    assert len(res) == 1
    assert res[0]["amount_kobo"] == 1500000


def test_txn_date_fallback_support():
    rows = [
        {
            "description": "Cloud VPS",
            "amount_kobo": 300000,
            "txn_date": d,
            "direction": "debit",
        }
        for d in ("2026-01-01", "2026-01-31", "2026-03-02")
    ]
    res = find_recurring(rows)
    assert len(res) == 1
    assert res[0]["period_days"] == 30
