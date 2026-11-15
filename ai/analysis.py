"""Pure analysis calculations for transactions, categories, and monthly trends.

Rules:
- Pure deterministic Python math.
- Money fields are integer kobo everywhere.
- Returns shapes matching web/types/api.ts Analysis.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any


def _parse_date(d: Any) -> date | None:
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        try:
            return date.fromisoformat(d[:10])
        except ValueError:
            return None
    return None


def calculate_analysis(
    transactions: list[dict[str, Any]],
    protections: list[str] | set[str] | None = None,
    imports: list[dict[str, Any]] | None = None,
    reconciliation_candidates: list[dict[str, Any]] | None = None,
    start: str | None = None,
    end: str | None = None,
    compare: str | None = None,
) -> dict[str, Any]:
    """Calculate the full analysis payload for a user's transactions."""
    prot_set = set(protections or [])
    imports_list = list(imports or [])
    candidates_list = list(reconciliation_candidates or [])

    parsed_txns: list[dict[str, Any]] = []
    dates: list[date] = []
    for t in transactions:
        t_date = _parse_date(t.get("txn_date") or t.get("date"))
        if t_date is None:
            continue
        parsed_txns.append({**t, "_parsed_date": t_date})
        dates.append(t_date)

    data_range: dict[str, str] | None = None
    if dates:
        dates_sorted = sorted(dates)
        data_range = {
            "start": dates_sorted[0].isoformat(),
            "end": dates_sorted[-1].isoformat(),
        }

    # Available months and banks
    months_set = {t["_parsed_date"].strftime("%Y-%m") for t in parsed_txns}
    available_months = sorted(months_set, reverse=True)
    banks_set = {str(t.get("bank", "")).lower() for t in parsed_txns if t.get("bank")}
    available_banks = sorted(banks_set)

    # Monthly totals for debits across all transactions
    monthly_totals_map: dict[str, int] = {m: 0 for m in available_months}
    for t in parsed_txns:
        if t.get("direction") == "debit":
            m_key = t["_parsed_date"].strftime("%Y-%m")
            monthly_totals_map[m_key] = monthly_totals_map.get(m_key, 0) + int(t.get("amount_kobo") or 0)

    max_month_total = max(monthly_totals_map.values()) if monthly_totals_map else 0
    monthly_totals = [
        {
            "month": m,
            "total_kobo": monthly_totals_map[m],
            "pct_of_max": round((monthly_totals_map[m] * 100.0) / max_month_total, 1)
            if max_month_total > 0
            else 0.0,
        }
        for m in sorted(available_months)
    ]

    # Determine requested range
    if start and end:
        range_start_dt = _parse_date(start) or date(1970, 1, 1)
        range_end_dt = _parse_date(end) or date(2099, 12, 31)
        range_dict = {"start": start, "end": end}
    elif data_range:
        # Default to latest month in data
        latest_month = available_months[0]
        y, m = map(int, latest_month.split("-"))
        # First day of month
        range_start_dt = date(y, m, 1)
        # Last day of month
        if m == 12:
            next_m = date(y + 1, 1, 1)
        else:
            next_m = date(y, m + 1, 1)
        range_end_dt = next_m - timedelta(days=1)
        range_dict = {
            "start": range_start_dt.isoformat(),
            "end": range_end_dt.isoformat(),
        }
    else:
        range_start_dt = date(1970, 1, 1)
        range_end_dt = date(1970, 1, 1)
        range_dict = {"start": "", "end": ""}

    # Filter transactions in range
    in_range = [
        t for t in parsed_txns if range_start_dt <= t["_parsed_date"] <= range_end_dt
    ]
    debits = [t for t in in_range if t.get("direction") == "debit"]
    credits = [t for t in in_range if t.get("direction") == "credit"]

    total_spent_kobo = sum(int(t.get("amount_kobo") or 0) for t in debits)
    total_income_kobo = sum(int(t.get("amount_kobo") or 0) for t in credits)
    txn_count = len(in_range)

    # Categories breakdown
    cat_totals: dict[str, int] = {}
    cat_counts: dict[str, int] = {}
    for t in debits:
        c_name = t.get("category") or "Uncategorised"
        cat_totals[c_name] = cat_totals.get(c_name, 0) + int(t.get("amount_kobo") or 0)
        cat_counts[c_name] = cat_counts.get(c_name, 0) + 1

    categories = [
        {
            "category": c,
            "total_kobo": cat_totals[c],
            "share_pct": round((cat_totals[c] * 100.0) / total_spent_kobo, 1)
            if total_spent_kobo > 0
            else 0.0,
            "txn_count": cat_counts[c],
            "protected": c in prot_set,
        }
        for c in cat_totals
    ]
    categories.sort(key=lambda x: x["total_kobo"], reverse=True)

    # Coverage
    days_with_data = len({t["_parsed_date"] for t in in_range})
    days_in_range = (range_end_dt - range_start_dt).days + 1 if range_dict["start"] else 0
    coverage = {
        "days_with_data": days_with_data,
        "days_in_range": max(days_in_range, 0),
    }

    # Coverage warnings
    coverage_warnings: list[str] = []
    if in_range:
        in_dates = sorted({t["_parsed_date"] for t in in_range})
        for d1, d2 in zip(in_dates, in_dates[1:]):
            gap = (d2 - d1).days - 1
            if gap >= 7:
                coverage_warnings.append(
                    f"No transactions for {gap} days in this range ({d1 + timedelta(days=1)} to {d2 - timedelta(days=1)})."
                )

    dup_count = len(candidates_list)
    if dup_count:
        coverage_warnings.append(
            f"{dup_count} possible duplicate{'s' if dup_count > 1 else ''} may be counted twice until reviewed."
        )

    # Needs review count
    needs_review_count = sum(
        1 for t in parsed_txns if t.get("review_state") in ("needs_review", "unreviewed")
    )

    # Comparison (if compare == 'previous')
    comparison_data: dict[str, Any] | None = None
    if compare == "previous" and range_dict["start"]:
        prev_end_dt = range_start_dt - timedelta(days=1)
        delta_days = (range_end_dt - range_start_dt).days
        prev_start_dt = prev_end_dt - timedelta(days=delta_days)
        prev_range = {
            "start": prev_start_dt.isoformat(),
            "end": prev_end_dt.isoformat(),
        }

        prev_txns = [
            t
            for t in parsed_txns
            if prev_start_dt <= t["_parsed_date"] <= prev_end_dt
            and t.get("direction") == "debit"
        ]
        prev_total = sum(int(t.get("amount_kobo") or 0) for t in prev_txns)
        prev_cat_totals: dict[str, int] = {}
        for t in prev_txns:
            c = t.get("category") or "Uncategorised"
            prev_cat_totals[c] = prev_cat_totals.get(c, 0) + int(t.get("amount_kobo") or 0)

        all_cats = set(cat_totals.keys()) | set(prev_cat_totals.keys())
        cat_changes = []
        for c in sorted(all_cats):
            curr_c = cat_totals.get(c, 0)
            prev_c = prev_cat_totals.get(c, 0)
            chg = curr_c - prev_c
            pct = round((chg * 100.0) / prev_c, 1) if prev_c > 0 else None
            cat_changes.append(
                {
                    "category": c,
                    "current_kobo": curr_c,
                    "previous_kobo": prev_c,
                    "change_kobo": chg,
                    "change_pct": pct,
                }
            )

        comparison_data = {
            "previous_range": prev_range,
            "previous_total_kobo": prev_total,
            "change_kobo": total_spent_kobo - prev_total,
            "categories": cat_changes,
        }

    return {
        "range": range_dict,
        "data_range": data_range,
        "available_months": available_months,
        "available_banks": available_banks,
        "monthly_totals": monthly_totals,
        "total_spent_kobo": total_spent_kobo,
        "total_income_kobo": total_income_kobo,
        "txn_count": txn_count,
        "categories": categories,
        "coverage": coverage,
        "coverage_warnings": coverage_warnings,
        "needs_review_count": needs_review_count,
        "reconciliation_candidates": candidates_list,
        "imports": imports_list,
        "comparison": comparison_data,
    }
