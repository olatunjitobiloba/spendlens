from dataclasses import dataclass

import pytest

from ai.duplicates import find_duplicates, statuses
from ai.schemas import Txn


def tx(i, ref=None, desc="DANFO FARE", **extra):
    row = {
        "id": i,
        "date": "2026-10-31",
        "amount_kobo": 480200,
        "direction": "debit",
        "description": desc,
        "account_alias": "4821",
        "bank": "gtbank",
        "reference": ref,
    }
    row.update(extra)
    return row


def test_identical_rows_without_reference_are_flagged_medium():
    d = find_duplicates([tx("a"), tx("b")])
    assert len(d) == 1
    assert d[0]["kind"] == "duplicate"
    assert d[0]["txn_ids"] == ["a", "b"] and d[0]["confidence"] == 0.6


def test_same_reference_is_high_confidence():
    d = find_duplicates([tx("a", "R1"), tx("b", "R1")])
    assert len(d) == 1
    assert d[0]["confidence"] == 0.95
    assert d[0]["txn_ids"] == ["a", "b"]


def test_different_references_are_not_duplicates():
    assert find_duplicates([tx("a", "R1"), tx("b", "R2")]) == []


def test_description_spacing_and_case_ignored():
    assert len(find_duplicates([tx("a"), tx("b", desc="danfo   fare")])) == 1


def test_single_row_is_clean():
    assert find_duplicates([tx("a")]) == []


def test_only_later_row_gets_status():
    s = statuses(find_duplicates([tx("a"), tx("b")]), [])
    assert s == {"b": "Possible duplicate"}


def test_low_confidence_category_status():
    assert statuses([], [{"txn_id": "x", "confidence": 0.4}]) == {"x": "Check category"}


def test_confidence_at_threshold_is_not_flagged():
    assert statuses([], [{"txn_id": "x", "confidence": 0.7}]) == {}


def test_duplicate_overrides_low_confidence_category_status():
    dups = find_duplicates([tx("a"), tx("b")])
    cats = [{"txn_id": "a", "confidence": 0.4}, {"txn_id": "b", "confidence": 0.4}]
    assert statuses(dups, cats) == {
        "a": "Check category",
        "b": "Possible duplicate",
    }


def test_three_identical_rows_flag_both_later_rows():
    dups = find_duplicates([tx("a"), tx("b"), tx("c")])
    assert dups[0]["txn_ids"] == ["a", "b", "c"]
    assert statuses(dups, []) == {
        "b": "Possible duplicate",
        "c": "Possible duplicate",
    }


def test_mixed_references_isolate_separate_payments():
    rows = [tx("a", "R1"), tx("b", "R1"), tx("c", "R2")]
    dups = find_duplicates(rows)
    assert len(dups) == 1
    assert dups[0]["txn_ids"] == ["a", "b"]
    assert dups[0]["confidence"] == 0.95


def test_whitespace_reference_treated_as_missing():
    dups = find_duplicates([tx("a", "   "), tx("b", None)])
    assert len(dups) == 1
    assert dups[0]["confidence"] == 0.6


def test_bank_normalization_and_unmapped_banks_stay_distinct():
    assert len(find_duplicates([tx("a", bank="GTB"), tx("b", bank="GTBank")])) == 1
    assert len(find_duplicates([tx("a", bank="Zenith"), tx("b", bank="zenith bank")])) == 1
    assert find_duplicates([tx("a", bank="Moniepoint"), tx("b", bank="Kuda")]) == []


def test_object_and_account_fallback_support():
    @dataclass
    class CatRes:
        txn_id: str
        confidence: float

    t1 = Txn(
        id="t1",
        description="FRESHMART YABA",
        amount_kobo=2311600,
        date="2026-10-30",
        direction="debit",
        bank="Zenith",
        account_alias="Debit card 0937",
    )
    t2 = {
        "id": "t2",
        "description": "freshmart   yaba",
        "amount_kobo": 2311600,
        "txn_date": "2026-10-30T09:12:00Z",
        "direction": "debit",
        "bank": "zenith bank",
        "account": "Debit card 0937",
    }
    dups = find_duplicates([t1, t2])
    assert len(dups) == 1
    assert dups[0]["txn_ids"] == ["t1", "t2"]
    assert statuses(dups, [CatRes(txn_id="t1", confidence=0.5)]) == {
        "t1": "Check category",
        "t2": "Possible duplicate",
    }


def test_missing_id_raises_value_error():
    bad = {"date": "2026-10-31", "amount_kobo": 480200, "description": "DANFO FARE"}
    with pytest.raises(ValueError, match="id"):
        find_duplicates([bad])

    blank_id = tx("   ")
    with pytest.raises(ValueError, match="id"):
        find_duplicates([blank_id])


def test_txn_accepts_account_alias_or_account_field():
    t1 = Txn(
        id="t1",
        description="DANFO FARE",
        amount_kobo=480200,
        date="2026-10-31",
        account="Current account 4821",
        bank="GTBank",
    )
    t2 = Txn(
        id="t2",
        description="DANFO FARE",
        amount_kobo=480200,
        date="2026-10-31",
        account_alias="Current account 4821",
        bank="gtb",
    )
    assert t1.account_alias == "Current account 4821"
    dups = find_duplicates([t1, t2])
    assert len(dups) == 1
    assert dups[0]["txn_ids"] == ["t1", "t2"]


def test_rows_missing_date_or_amount_are_not_grouped_as_duplicates():
    incomplete = [
        {"id": "x1", "description": ""},
        {"id": "x2", "description": ""},
    ]
    assert find_duplicates(incomplete) == []
