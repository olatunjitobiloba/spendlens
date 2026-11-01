import json
from pathlib import Path

import pytest

from ai.schemas import ScenarioResult
from ai.validate import fmt_naira, validate

FIXTURES = Path(__file__).parent.parent / "fixtures"


def load(name) -> ScenarioResult:
    return ScenarioResult.model_validate(json.loads((FIXTURES / name).read_text()))


S1 = load("scenario_01.json")


def test_fmt_naira():
    assert fmt_naira(1200000) == "₦12,000"
    assert fmt_naira(150049) == "₦1,500.49"
    assert fmt_naira(0) == "₦0"


def test_good_text_passes():
    text = (
        "Cutting Food by 20% saves ₦12,000 and Entertainment by 40% saves ₦10,000. "
        "Total: ₦22,000 of ₦185,000. Note: No transactions for 12 days."
    )
    assert validate(text, S1, numbers_used=[1200000, 1000000, 2200000]) == []


def test_wrong_amount_fails():
    assert validate("You would save ₦13,000.", S1)


def test_wrong_percent_fails():
    assert validate("Cut Food by 25%.", S1)


def test_abbreviation_fails():
    assert validate("You would save ₦12k.", S1)


def test_naira_word_suffix_checked():
    assert validate("You would save 12,000 naira.", S1) == []
    assert validate("You would save 99,000 naira.", S1)


def test_invented_plain_number_fails():
    assert validate("Over 7 days you save more.", S1)
    assert validate("There are 12 days with no data.", S1) == []


def test_numbers_used_unknown_fails():
    assert validate("Fine text.", S1, numbers_used=[999])


def test_fractional_kobo_fails():
    assert validate("Save ₦12,000.555.", S1)


def test_remaining_amount_allowed():
    assert validate("You would have ₦163,000 left.", S1) == []


@pytest.mark.parametrize("name", sorted(p.name for p in FIXTURES.glob("scenario_*.json")))
def test_template_text_passes_for_every_fixture(name):
    s = load(name)
    parts = [
        f"{c.category}: {c.percent}% saves {fmt_naira(c.reduction_kobo)}"
        for c in s.categories
    ]
    text = (
        ". ".join(parts)
        + f". Total {fmt_naira(s.total_reduction_kobo)} of {fmt_naira(s.baseline_kobo)}."
    )
    assert validate(text, s) == []
