"""Observable V1 categorization expectations; challenge answers stay held out."""

from dataclasses import replace
from datetime import date, time
import json
from pathlib import Path

import pytest

from ml import MODEL_VERSION, CategoryResult, Txn, categorize
from ml.synthetic import generate_dataset


def transaction(description, txn_id="synthetic-row"):
    return Txn(
        id=txn_id,
        date=date(2026, 3, 10),
        time=None,
        description=description,
        amount_kobo=10000,
        direction="debit",
        account_alias="invented-account",
        reference=None,
        bank="other",
    )


@pytest.mark.parametrize(
    ("description", "category"),
    [
        ("Food rice canteen", "Food"),
        ("BUS fare", "Transport"),
        ("airtime", "Airtime and Data"),
        ("cinema ticket", "Entertainment"),
        ("clothing purchase", "Shopping"),
        ("electricity utility bill", "Bills and Utilities"),
        ("school tuition", "Education"),
        ("pharmacy medicine", "Health"),
        ("transfer to savings", "Savings and Transfers"),
        ("monthly salary", "Income"),
        ("Allowance received", "Income"),
        ("allowance", "Uncategorized"),
        ("allowance later received", "Uncategorized"),
        ("ALLOWANCE-123-RECEIVED", "Income"),
        ("food/transport", "Uncategorized"),
        ("rice monthly salary", "Uncategorized"),
        ("airtimekeeper", "Uncategorized"),
        ("transportation", "Uncategorized"),
        ("air123time", "Uncategorized"),
        ("Payment", "Uncategorized"),
        ("Own wallet funding", "Uncategorized"),
        ("Service fee", "Uncategorized"),
        ("123!!!", "Uncategorized"),
        ("", "Uncategorized"),
    ],
)
def test_exact_rules_and_abstention(description, category):
    confidence = 0.0 if category == "Uncategorized" else 0.9
    expected = CategoryResult(
        txn_id="synthetic-row",
        category=category,
        confidence=confidence,
    )
    assert categorize([transaction(description)]) == [expected]


def test_development_fixture_answers():
    # Only development examples guide rules; the frozen challenge is not read.
    fixture_path = Path(__file__).parent / "fixtures" / "development.json"
    document = json.loads(fixture_path.read_text(encoding="utf-8"))
    for case in document["cases"]:
        txns = []
        expected = []
        for row in case["transactions"]:
            values = dict(row)
            values["date"] = date.fromisoformat(values["date"])
            if values["time"] is not None:
                values["time"] = time.fromisoformat(values["time"])
            txns.append(Txn(**values))
            answer = case["expected"]["categories"][row["id"]]
            result = CategoryResult(
                txn_id=row["id"],
                **answer,
            )
            expected.append(result)
        assert categorize(txns) == expected, case["name"]


@pytest.mark.parametrize("seed", [20261111, 7])
def test_generated_order_cardinality_and_determinism(seed):
    dataset = generate_dataset(seed)
    txns = list(reversed(dataset.transactions))
    original = list(txns)
    results = categorize(txns)
    assert txns == original
    assert len(results) == len(txns)
    assert [result.txn_id for result in results] == [txn.id for txn in txns]
    assert categorize(txns) == results
    # Expected labels are inspected by tests only, never passed to the detector.
    labels = dict(dataset.category_labels)
    assert [result.category for result in results] == [labels[txn.id] for txn in txns]
    assert all(result.method == "rule" for result in results)
    assert all(result.model_version == MODEL_VERSION for result in results)


def test_metadata_does_not_supply_category_evidence():
    original = transaction("Payment")
    variants = [original]
    for bank in ("opay", "gtbank", "ecobank", "access", "zenith"):
        variant = replace(
            original,
            id=bank,
            bank=bank,
            direction="credit",
            amount_kobo=25000000,
            reference="salary",
            account_alias="food",
        )
        variants.append(variant)
    assert all(result.category == "Uncategorized" for result in categorize(variants))


def test_empty_and_invalid_calls():
    assert categorize([]) == []
    with pytest.raises(TypeError, match="txns must be a list"):
        categorize(())
    with pytest.raises(TypeError, match="only Txn"):
        categorize([object()])
    txn = transaction("rice")
    with pytest.raises(ValueError, match="IDs must be unique"):
        categorize([txn, txn])
