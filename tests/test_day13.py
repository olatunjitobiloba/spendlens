import json
from pathlib import Path

from ai.banks import normalize_bank
from ai.next_steps import next_steps
from ai.schemas import Txn

CTX = {
    "baseline_kobo": 500000,
    "total_reduction_kobo": 0,
    "remaining_kobo": 500000,
    "categories": [
        {"name": "Food", "amount_kobo": 200000},
        {"name": "Rent", "amount_kobo": 300000},
    ],
    "protected": ["Rent"],
    "cuts": [],
}


def test_bank_aliases_and_typo():
    assert normalize_bank("Acces Bank") == "access"
    assert normalize_bank(" GTB ") == "gtbank"
    assert normalize_bank("Zenith") == "zenith"
    assert normalize_bank("zenith bank") == "zenith"
    assert normalize_bank("guaranty-trust-bank") == "gtbank"
    assert normalize_bank("zenith-bank") == "zenith"
    assert normalize_bank("access-bank") == "access"
    assert normalize_bank("ecobank-nigeria") == "ecobank"
    assert normalize_bank("paycom") == "opay"


def test_unknown_or_missing_bank_is_other():
    assert normalize_bank("Moniepoint") == "other"
    assert normalize_bank(None) == "other"


def test_top_step_skips_protected_category():
    assert "Food" in next_steps(CTX, [])[0]["text"]


def test_repeat_payment_step_uses_computed_total():
    rec = [{"amount_kobo": 450000}, {"amount_kobo": 50000}]
    assert "₦5,000.00" in next_steps(CTX, rec)[-1]["text"]


def test_over_baseline_step():
    assert any(
        s["kind"] == "over_baseline"
        for s in next_steps({**CTX, "remaining_kobo": -1}, [])
    )


def test_no_investment_words():
    text = " ".join(s["text"] for s in next_steps(CTX, [{"amount_kobo": 1}])).lower()
    assert "invest" not in text and "subscription" not in text


def test_txn_normalizes_bank():
    t1 = Txn(
        description="POS Transfer",
        amount_kobo=50000,
        date="2026-01-01",
        bank="GTBank",
    )
    assert t1.bank == "gtbank"

    t2 = Txn(
        description="POS Transfer",
        amount_kobo=50000,
        date="2026-01-01",
        bank="Random Bank",
    )
    assert t2.bank == "other"

    t3 = Txn(description="POS Transfer", amount_kobo=50000, date="2026-01-01")
    assert t3.bank == "other"


def test_next_steps_with_scenario_fixture():
    fixture = json.loads(
        (Path(__file__).parent.parent / "fixtures" / "scenario_01.json").read_text()
    )
    steps = next_steps(fixture, [{"amount_kobo": 450000}])
    assert len(steps) == 2
    assert steps[0]["kind"] == "top_category"
    assert "Shopping" in steps[0]["text"]
    assert steps[1]["kind"] == "repeat_payments"
    assert "₦4,500.00" in steps[1]["text"]
