from collections import defaultdict
from typing import Any

from ai.banks import normalize_bank
from ai.recurring import extract_field

HIGH_CONFIDENCE = 0.95
MEDIUM_CONFIDENCE = 0.6


def _norm_bank(raw: Any) -> str:
    """Normalize known bank aliases while keeping distinct unmapped banks separate."""
    norm = normalize_bank(raw)
    if norm != "other":
        return norm
    cleaned = str(raw or "").strip().lower()
    return cleaned or "other"


def _clean_ref(t: Any) -> str | None:
    raw = extract_field(t, "reference", "bank_reference")
    if raw is None:
        return None
    cleaned = str(raw).strip()
    return cleaned or None


def _is_valid_id(tid: Any) -> bool:
    return tid is not None and not (isinstance(tid, str) and not tid.strip())


def _txn_id(t: Any) -> Any:
    tid = extract_field(t, "id", "txn_id")
    if not _is_valid_id(tid):
        raise ValueError("Transaction missing 'id'")
    return tid


def _key(t: Any) -> tuple | None:
    raw_date = extract_field(t, "date", "txn_date")
    date_str = str(raw_date or "").strip()[:10]
    amount = extract_field(t, "amount_kobo")
    if not date_str or isinstance(amount, bool) or not isinstance(amount, (int, float)):
        return None
    direction = str(extract_field(t, "direction") or "debit").strip().lower()
    desc = " ".join(str(extract_field(t, "description") or "").lower().split())
    account = " ".join(
        str(extract_field(t, "account_alias", "account") or "").lower().split()
    )
    bank = _norm_bank(extract_field(t, "bank"))
    return (date_str, amount, direction, desc, account, bank)


def _candidate(group: list[Any], *, same_ref: bool) -> dict:
    return {
        "kind": "duplicate",
        "txn_ids": [_txn_id(t) for t in group],
        "confidence": HIGH_CONFIDENCE if same_ref else MEDIUM_CONFIDENCE,
        "reason": (
            "Same bank reference"
            if same_ref
            else "Same date, amount, description and account"
        ),
    }


def _candidates_for_bucket(group: list[Any]) -> list[dict]:
    if len(group) < 2:
        return []
    refs = [_clean_ref(t) for t in group]
    distinct_refs = {r for r in refs if r is not None}

    if len(distinct_refs) <= 1:
        same_ref = len(distinct_refs) == 1 and all(r is not None for r in refs)
        return [_candidate(group, same_ref=same_ref)]

    by_ref: dict[str | None, list[Any]] = defaultdict(list)
    for txn, ref in zip(group, refs):
        by_ref[ref].append(txn)

    return [
        _candidate(sub, same_ref=(ref is not None))
        for ref, sub in by_ref.items()
        if len(sub) >= 2
    ]


def find_duplicates(txns: list[Any]) -> list[dict]:
    """Identify possible duplicate transactions without mutating or deleting rows."""
    groups: dict[tuple, list[Any]] = defaultdict(list)
    for t in txns:
        _txn_id(t)
        key = _key(t)
        if key is not None:
            groups[key].append(t)

    found = []
    for g in groups.values():
        found.extend(_candidates_for_bucket(g))
    return found


def statuses(
    dups: list[Any],
    cats: list[Any],
    min_conf: float = 0.7,
) -> dict[Any, str]:
    """Return user-facing status labels keyed by transaction ID."""
    out: dict[Any, str] = {}
    for c in cats:
        tid = extract_field(c, "txn_id", "id")
        conf = extract_field(c, "confidence")
        if (
            _is_valid_id(tid)
            and isinstance(conf, (int, float))
            and not isinstance(conf, bool)
            and conf < min_conf
        ):
            out[tid] = "Check category"

    for d in dups:
        txn_ids = extract_field(d, "txn_ids") or []
        for tid in txn_ids[1:]:
            if _is_valid_id(tid):
                out[tid] = "Possible duplicate"
    return out
