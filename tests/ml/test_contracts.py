"""Expected typed boundaries for the V1 backend integration."""

from dataclasses import MISSING, FrozenInstanceError, fields, replace
from datetime import date, datetime, time

import pytest

from ml import BANKS, CATEGORIES, MODEL_VERSION, Candidate, CategoryResult, Txn
from ml.types import validate_transactions


@pytest.fixture
def txn():
    return Txn(
        id="synthetic-1",
        date=date(2026, 1, 1),
        time=None,
        description="Invented test purchase",
        amount_kobo=100,
        direction="debit",
        account_alias="synthetic-account",
        reference=None,
        bank="other",
    )


def test_transaction_fields_and_frozen_money(txn):
    expected_fields = [
        "id", "date", "time", "description", "amount_kobo",
        "direction", "account_alias", "reference", "bank",
    ]
    assert [field.name for field in fields(Txn)] == expected_fields
    assert txn.amount_kobo == 100
    assert txn.bank == "other"
    with pytest.raises(FrozenInstanceError):
        txn.amount_kobo = 200
    assert txn.description not in repr(txn)


@pytest.mark.parametrize(
    "field,value,error",
    [
        ("amount_kobo", True, TypeError),
        ("amount_kobo", 1.0, TypeError),
        ("amount_kobo", "100", TypeError),
        ("amount_kobo", 0, ValueError),
        ("amount_kobo", -1, ValueError),
        ("date", "2026-01-01", TypeError),
        ("date", datetime(2026, 1, 1), TypeError),
        ("time", "12:00", TypeError),
        ("direction", "DEBIT", ValueError),
        ("direction", 1, TypeError),
        ("id", " ", ValueError),
        ("id", 1, TypeError),
        ("account_alias", "", ValueError),
        ("description", None, TypeError),
        ("reference", "", ValueError),
        ("reference", 1, TypeError),
    ],
)
def test_invalid_transaction_fields_fail_without_values(txn, field, value, error):
    with pytest.raises(error) as caught:
        replace(txn, **{field: value})
    assert field in str(caught.value)
    assert txn.description not in str(caught.value)


def test_optional_fields_and_boundary_values(txn):
    from datetime import timezone

    updated = replace(
        txn,
        amount_kobo=1,
        time=time(12, 30),
        direction="credit",
        description="",
        reference="synthetic-reference",
    )
    assert updated.time == time(12, 30)
    assert updated.reference == "synthetic-reference"
    assert replace(txn, amount_kobo=10**30).amount_kobo == 10**30
    with pytest.raises(ValueError, match="time"):
        replace(txn, time=time(12, tzinfo=timezone.utc))


def test_required_normalized_bank_values(txn):
    # Every transaction carries one known institution token, including other.
    assert BANKS == (
        "opay",
        "gtbank",
        "ecobank",
        "access",
        "zenith",
        "other",
    )
    assert fields(Txn)[-1].default is MISSING

    for bank in BANKS:
        assert replace(txn, bank=bank).bank == bank


@pytest.mark.parametrize(
    "bank,error",
    [
        (None, TypeError),
        (1, TypeError),
        ("", ValueError),
        ("Opay", ValueError),
        ("moniepoint", ValueError),
    ],
)
def test_invalid_bank_values_fail_without_echoing_input(txn, bank, error):
    with pytest.raises(error, match="bank") as caught:
        replace(txn, bank=bank)

    assert txn.description not in str(caught.value)


def test_bank_cannot_be_omitted(txn):
    values = {
        name: getattr(txn, name)
        for name in ("id", "date", "time", "description", "amount_kobo",
                     "direction", "account_alias", "reference")
    }

    with pytest.raises(TypeError, match="bank"):
        Txn(**values)


def test_unique_ids_are_a_call_boundary(txn):
    second = replace(txn, id="synthetic-2")
    txns = [txn, second]
    assert validate_transactions([]) is None
    assert validate_transactions(txns) is None
    assert txns == [txn, second]
    with pytest.raises(ValueError, match="unique") as caught:
        validate_transactions([txn, replace(txn, amount_kobo=200)])
    assert txn.id not in str(caught.value)


@pytest.mark.parametrize("value", [None, (), {}, ["invalid"], [None]])
def test_invalid_call_container_or_element(value):
    with pytest.raises(TypeError):
        validate_transactions(value)


def test_category_vocabulary_and_results():
    assert CATEGORIES == (
        "Food", "Transport", "Airtime and Data", "Entertainment", "Shopping",
        "Bills and Utilities", "Education", "Health", "Savings and Transfers",
        "Income", "Uncategorized",
    )
    assert MODEL_VERSION == "ml-0.1.0"
    result = CategoryResult("synthetic-1", "Food", 0.9)
    assert [field.name for field in fields(result)] == [
        "txn_id", "category", "confidence", "method", "model_version",
    ]
    assert result.method == "rule"
    assert result.model_version == MODEL_VERSION
    with pytest.raises(FrozenInstanceError):
        result.category = "Income"


def test_candidate_contract():
    candidate = Candidate(
        id="duplicate:synthetic-digest",
        kind="duplicate",
        txn_ids=("synthetic-1", "synthetic-2"),
        reason="Matching canonical fields; review required.",
        confidence=0.6,
    )
    assert [field.name for field in fields(candidate)] == [
        "id", "kind", "txn_ids", "reason", "confidence", "method", "model_version",
    ]
    assert candidate.method == "rule"
    assert candidate.model_version == MODEL_VERSION
    with pytest.raises(FrozenInstanceError):
        candidate.reason = "changed"

    # Pair membership is immutable, distinct and canonical before detection exists.
    for pair in [("b", "a"), ("a", "a"), ("", "b")]:
        with pytest.raises(ValueError, match="txn_ids"):
            replace(candidate, txn_ids=pair)
    for pair in [["a", "b"], ("a",), (1, "b")]:
        with pytest.raises(TypeError, match="txn_ids"):
            replace(candidate, txn_ids=pair)
    with pytest.raises(ValueError, match="kind"):
        replace(candidate, kind="refund")
    with pytest.raises(ValueError, match="reason"):
        replace(candidate, reason=" ")


@pytest.mark.parametrize("confidence", [-0.1, 1.1, float("nan"), float("inf")])
def test_invalid_confidence_values(confidence):
    with pytest.raises(ValueError, match="confidence"):
        CategoryResult("synthetic-1", "Food", confidence)


@pytest.mark.parametrize("confidence", [True, 1, "0.9"])
def test_confidence_must_be_a_float(confidence):
    with pytest.raises(TypeError, match="confidence"):
        CategoryResult("synthetic-1", "Food", confidence)


@pytest.mark.parametrize(
    "changes",
    [
        {"category": "Unknown"},
        {"txn_id": ""},
        {"method": "model"},
        {"model_version": "ml-9.0.0"},
    ],
)
def test_invalid_result_metadata(changes):
    result = CategoryResult("synthetic-1", "Food", 0.9)
    with pytest.raises(ValueError):
        replace(result, **changes)
