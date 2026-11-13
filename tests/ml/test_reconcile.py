"""Exact synthetic pair expectations; held-out challenge stays unevaluated."""

from dataclasses import replace
from datetime import date, time, timedelta
from itertools import permutations
import json
from pathlib import Path

import pytest

from ml import MODEL_VERSION, Txn, find_reconciliation_candidates
from ml.synthetic import generate_dataset


def transaction(txn_id="a", **changes):
    original = Txn(
        id=txn_id,
        date=date(2026, 3, 10),
        time=None,
        description="Invented merchant rice",
        amount_kobo=100000,
        direction="debit",
        account_alias="synthetic-main",
        reference=None,
        bank="other",
    )
    return replace(original, **changes)


def pair_answers(results):
    return [(item.kind, item.txn_ids, item.confidence) for item in results]


@pytest.mark.parametrize(
    ("first_reference", "second_reference", "confidence"),
    [
        ("same", "same", 0.9),
        (None, None, 0.6),
        (None, "same", 0.6),
        ("same", None, 0.6),
        ("first", "second", None),
        ("Same", "same", None),
    ],
)
def test_duplicate_reference_matrix(first_reference, second_reference, confidence):
    # Repeated legitimate purchases remain candidates, including absent references.
    txns = [
        transaction("a", reference=first_reference),
        transaction("b", reference=second_reference),
    ]
    expected = []
    if confidence is not None:
        expected = [("duplicate", ("a", "b"), confidence)]
    assert pair_answers(find_reconciliation_candidates(txns)) == expected


@pytest.mark.parametrize(
    "changes",
    [
        {"account_alias": "synthetic-other"},
        {"direction": "credit"},
        {"amount_kobo": 100001},
        {"date": date(2026, 3, 11)},
        {"description": "different merchant"},
    ],
)
def test_duplicate_required_field_boundaries(changes):
    txns = [transaction(), transaction("b", **changes)]
    assert find_reconciliation_candidates(txns) == []


def test_duplicate_normalization_ignores_time_and_bank():
    txns = [
        transaction(description="POS: RICE-123 shop", time=time(1)),
        transaction(
            "b",
            description="  pos rice 999 SHOP!!! ",
            time=time(23, 59),
            bank="opay",
        ),
    ]
    assert pair_answers(find_reconciliation_candidates(txns)) == [
        ("duplicate", ("a", "b"), 0.6),
    ]


@pytest.mark.parametrize("day_offset", [-2, -1, 0, 1, 2])
@pytest.mark.parametrize("clue_on_credit", [False, True])
def test_transfer_calendar_boundaries_and_either_clue(day_offset, clue_on_credit):
    # Calendar distance governs matching even when times or date order differ.
    debit_text = "neutral" if clue_on_credit else "TRANSFER-123 to wallet"
    credit_text = "TRANSFER received" if clue_on_credit else "neutral"
    txns = [
        transaction(description=debit_text, time=time(0, 1)),
        transaction(
            "b",
            description=credit_text,
            direction="credit",
            account_alias="synthetic-other",
            date=date(2026, 3, 10) + timedelta(days=day_offset),
            time=time(23, 59),
            reference="independent-reference",
        ),
    ]
    expected = []
    if abs(day_offset) <= 1:
        expected = [("internal_transfer", ("a", "b"), 0.8)]
    assert pair_answers(find_reconciliation_candidates(txns)) == expected


@pytest.mark.parametrize(
    "changes",
    [
        {"account_alias": "synthetic-main"},
        {"direction": "debit"},
        {"amount_kobo": 100001},
        {"amount_kobo": 99999},
    ],
)
def test_transfer_required_field_boundaries(changes):
    debit = transaction(description="transfer to wallet")
    credit = transaction(
        "b",
        direction="credit",
        account_alias="synthetic-other",
        description="received",
    )
    assert find_reconciliation_candidates([debit, replace(credit, **changes)]) == []


@pytest.mark.parametrize("description", ["payment", "transferred", "pretransfer", "trans123fer", "refund rice"])
def test_no_transfer_without_complete_word_clue(description):
    txns = [
        transaction(description=description),
        transaction(
            "b",
            description="received",
            direction="credit",
            account_alias="synthetic-other",
        ),
    ]
    assert find_reconciliation_candidates(txns) == []


def test_fees_are_separate_and_missing_counterpart_is_not_a_transfer():
    debit = transaction(description="transfer to wallet")
    fee = transaction("fee", description="transfer fee", amount_kobo=100)
    assert find_reconciliation_candidates([debit, fee]) == []
    credit = transaction(
        "credit",
        direction="credit",
        account_alias="synthetic-other",
        description="received",
    )
    assert pair_answers(find_reconciliation_candidates([debit, fee, credit])) == [
        ("internal_transfer", ("a", "credit"), 0.8),
    ]
    net_credit = replace(credit, amount_kobo=99900)
    assert find_reconciliation_candidates([debit, fee, net_credit]) == []


def test_all_pairs_identity_order_permutations_and_nonmutation():
    # Three identical debits produce three duplicate pairs and share one credit.
    txns = [
        transaction("c", description="transfer private synthetic marker"),
        transaction("a", description="transfer private synthetic marker"),
        transaction("b", description="transfer private synthetic marker"),
        transaction("d", direction="credit", account_alias="other-account"),
    ]
    expected = [
        ("duplicate", ("a", "b"), 0.6),
        ("duplicate", ("a", "c"), 0.6),
        ("duplicate", ("b", "c"), 0.6),
        ("internal_transfer", ("a", "d"), 0.8),
        ("internal_transfer", ("b", "d"), 0.8),
        ("internal_transfer", ("c", "d"), 0.8),
    ]
    results = find_reconciliation_candidates(txns)
    assert pair_answers(results) == expected
    assert len({item.id for item in results}) == 6
    for ordering in permutations(txns):
        inputs = list(ordering)
        before = [vars(item).copy() for item in inputs]
        assert find_reconciliation_candidates(inputs) == results
        assert inputs == list(ordering)
        assert [vars(item) for item in inputs] == before
    for item in results:
        assert item.method == "rule"
        assert item.model_version == MODEL_VERSION
        assert "review" in item.reason.lower()
        assert "private synthetic marker" not in item.reason


def test_candidate_identity_matches_frozen_recipe():
    # Pin the external identity contract with a separately precomputed digest.
    results = find_reconciliation_candidates([transaction("b"), transaction("a")])
    assert results[0].id == "duplicate:edaae078c017558495064cdc4b40f211eff8236e439f6cd04009f58ab110ba2f"


def test_development_fixture_pairs():
    # Load development answers only; do not inspect or tune against challenge.
    fixture = Path(__file__).parent / "fixtures" / "development.json"
    document = json.loads(fixture.read_text(encoding="utf-8"))
    all_txns = []
    all_expected = []
    for case in document["cases"]:
        txns = []
        for row in case["transactions"]:
            values = dict(row)
            values["date"] = date.fromisoformat(values["date"])
            if values["time"] is not None:
                values["time"] = time.fromisoformat(values["time"])
            txns.append(Txn(**values))
        expected = [
            (pair["kind"], tuple(pair["txn_ids"]), pair["confidence"])
            for pair in case["expected"]["candidates"]
        ]
        assert pair_answers(find_reconciliation_candidates(txns)) == sorted(expected), case["name"]
        all_txns.extend(txns)
        all_expected.extend(expected)
    assert pair_answers(find_reconciliation_candidates(all_txns)) == sorted(all_expected)


@pytest.mark.parametrize("seed", [20261111, 7])
def test_generated_pairs(seed):
    dataset = generate_dataset(seed)
    expected = sorted(
        (pair.kind, pair.txn_ids, pair.confidence)
        for pair in dataset.candidate_labels
    )
    txns = list(dataset.transactions)
    results = find_reconciliation_candidates(txns)
    assert pair_answers(results) == expected
    assert find_reconciliation_candidates(list(reversed(txns))) == results


def test_empty_single_and_invalid_calls():
    assert find_reconciliation_candidates([]) == []
    assert find_reconciliation_candidates([transaction()]) == []
    with pytest.raises(TypeError, match="txns must be a list"):
        find_reconciliation_candidates(())
    with pytest.raises(TypeError, match="only Txn"):
        find_reconciliation_candidates([object()])
    with pytest.raises(ValueError, match="IDs must be unique"):
        find_reconciliation_candidates([transaction(), transaction()])
