import re
import statistics
from collections import defaultdict
from datetime import date, timedelta
from itertools import pairwise
from typing import Any

MIN_OCCURRENCES = 3
PERIODS = {7: 1, 14: 2, 30: 3}  # period_days: allowed gap error in days


def merchant_key(description: str) -> str:
    """'StreamCo *1234 LAGOS' and 'STREAMCO 5678 LAGOS' share a key."""
    words = re.sub(r"[^a-z ]", " ", description.lower()).split()
    return " ".join(words[:3])


def extract_field(t: Any, field_name: str, fallback_name: str = "") -> Any:
    """Read a field from a dict or object, falling back when missing or blank."""
    if isinstance(t, dict):
        val = t.get(field_name)
        if (val is None or val == "") and fallback_name:
            val = t.get(fallback_name)
        return val
    val = getattr(t, field_name, None)
    if (val is None or val == "") and fallback_name:
        val = getattr(t, fallback_name, None)
    return val


def find_recurring(txns: list[Any]) -> list[dict]:
    groups = defaultdict(set)
    for t in txns:
        direction = extract_field(t, "direction")
        if direction != "debit":
            continue
        desc = str(extract_field(t, "description") or "")
        amt = extract_field(t, "amount_kobo")
        if amt is None:
            continue
        raw_date = extract_field(t, "date", fallback_name="txn_date")
        if not raw_date:
            continue
        date_str = str(raw_date)[:10]
        try:
            d = date.fromisoformat(date_str)
        except ValueError:
            continue
        key = (merchant_key(desc), amt)
        groups[key].add(d)  # a set drops same-day duplicates

    found = []
    for (key, amount), days in groups.items():
        days = sorted(days)
        if not key or len(days) < MIN_OCCURRENCES:
            continue
        gaps = [(b - a).days for a, b in pairwise(days)]
        mid = statistics.median(gaps)
        for period, tol in PERIODS.items():
            if abs(mid - period) <= tol and all(abs(g - period) <= tol for g in gaps):
                found.append(
                    {
                        "merchant_key": key,
                        "amount_kobo": amount,
                        "period_days": period,
                        "next_due": (days[-1] + timedelta(days=period)).isoformat(),
                        "occurrences": len(days),
                        "confidence": min(0.95, 0.5 + 0.1 * len(days)),
                    }
                )
                break
    return sorted(found, key=lambda r: (-r["confidence"], r["merchant_key"]))
