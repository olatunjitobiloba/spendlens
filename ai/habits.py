"""Habit timing, impulse spending detection, and emotional spending auditing.

Zero third-party API dependencies. Pure deterministic analysis of timestamps,
frequency, and debit amounts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class HabitAudit:
    total_analyzed_txns: int
    late_night_kobo: int
    late_night_count: int
    weekend_kobo: int
    weekend_count: int
    weekend_surge_percentage: float
    micro_drain_count: int
    micro_drain_kobo: int
    warnings: list[str] = field(default_factory=list)
    actionable_cuts: list[str] = field(default_factory=list)


def _parse_iso_datetime(val: Any) -> datetime | None:
    if not val:
        return None
    s = str(val).strip()
    try:
        # Replace Z with +00:00 for fromisoformat compatibility in 3.10+
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s)
    except Exception:
        # Try date-only
        try:
            return datetime.strptime(s[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            return None


def analyze_habits(txns: list[dict[str, Any]]) -> HabitAudit:
    """Audits transaction timing to expose emotional, late-night, and weekend impulse spending."""
    if not txns:
        return HabitAudit(
            total_analyzed_txns=0,
            late_night_kobo=0,
            late_night_count=0,
            weekend_kobo=0,
            weekend_count=0,
            weekend_surge_percentage=0.0,
            micro_drain_count=0,
            micro_drain_kobo=0,
            warnings=[],
            actionable_cuts=[],
        )

    late_night_kobo = 0
    late_night_count = 0
    weekend_kobo = 0
    weekend_count = 0
    total_debit_kobo = 0
    micro_drain_count = 0
    micro_drain_kobo = 0

    debit_txns: list[dict[str, Any]] = []

    for t in txns:
        direction = t.get("direction", "debit")
        if direction != "debit":
            continue
        amt = t.get("amount_kobo")
        if amt is None or amt <= 0:
            continue

        debit_txns.append(t)
        total_debit_kobo += amt

        # Micro-drain: small debits <= ₦2,500 (e.g. repeated airtime, USSD fees, quick small transfers)
        if amt <= 250000:
            micro_drain_count += 1
            micro_drain_kobo += amt

        raw_time = t.get("timestamp") or t.get("created_at") or t.get("date")
        dt = _parse_iso_datetime(raw_time)
        if not dt:
            continue

        # Check late night: between 22:00 (10 PM) and 04:30 (4:30 AM)
        # Note: if hour is 22, 23, 0, 1, 2, 3, or (4 and minute <= 30)
        hour = dt.hour
        is_late_night = hour in (22, 23, 0, 1, 2, 3) or (hour == 4 and dt.minute <= 30)
        if is_late_night:
            late_night_kobo += amt
            late_night_count += 1

        # Check weekend: Friday (4), Saturday (5), Sunday (6)
        if dt.weekday() in (4, 5, 6):
            weekend_kobo += amt
            weekend_count += 1

    weekend_surge_pct = (weekend_kobo / total_debit_kobo * 100.0) if total_debit_kobo > 0 else 0.0

    warnings: list[str] = []
    actionable_cuts: list[str] = []

    if late_night_count > 0:
        naira_val = late_night_kobo / 100
        warnings.append(
            f"Detected {late_night_count} late-night purchases totaling ₦{naira_val:,.0f} "
            f"between 10 PM and 4:30 AM. Late-night spending is frequently emotional or impulsive."
        )
        actionable_cuts.append("Freeze card ordering after 10 PM to prevent late-night takeout and impulse deliveries.")

    if weekend_surge_pct > 60.0 and total_debit_kobo > 1000000:
        warnings.append(
            f"{weekend_surge_pct:.1f}% of your spending occurs between Friday and Sunday. "
            f"Weekend outings are your primary financial leak."
        )
        actionable_cuts.append("Set a strict Friday-Sunday cash or debit card allowance to curb weekend surges.")

    if micro_drain_count >= 10:
        micro_naira = micro_drain_kobo / 100
        warnings.append(
            f"{micro_drain_count} small debits under ₦2,500 leaked ₦{micro_naira:,.0f} in micro-transfers and airtime."
        )
        actionable_cuts.append("Consolidate airtime and data recharges to once per week instead of frequent micro-topups.")

    return HabitAudit(
        total_analyzed_txns=len(debit_txns),
        late_night_kobo=late_night_kobo,
        late_night_count=late_night_count,
        weekend_kobo=weekend_kobo,
        weekend_count=weekend_count,
        weekend_surge_percentage=round(weekend_surge_pct, 1),
        micro_drain_count=micro_drain_count,
        micro_drain_kobo=micro_drain_kobo,
        warnings=warnings,
        actionable_cuts=actionable_cuts,
    )
