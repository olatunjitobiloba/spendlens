import json
from pathlib import Path

import pytest

from ai.explain import explain, template_explanation
from ai.schemas import ScenarioResult
from ai.validate import validate

FIXTURES = Path(__file__).parent.parent / "fixtures"
FILES = sorted(FIXTURES.glob("scenario_*.json"))


def load(name) -> ScenarioResult:
    return ScenarioResult.model_validate(json.loads((FIXTURES / name).read_text()))


S1 = load("scenario_01.json")

GOOD = json.dumps({
    "text": (
        "Cutting Food by 20% saves ₦12,000 and Entertainment by 40% saves ₦10,000, "
        "a total of ₦22,000. You would have ₦163,000 left."
    ),
    "numbers_used": [1200000, 1000000, 2200000, 16300000],
})
WRONG = json.dumps({"text": "You would save ₦13,000.", "numbers_used": [1300000]})


def test_good_output_is_accepted():
    e = explain(S1, llm=lambda sys, usr: GOOD)
    assert e.source == "model"


def test_wrong_number_falls_back():
    assert explain(S1, llm=lambda sys, usr: WRONG).source == "template"


def test_invalid_json_falls_back():
    assert explain(S1, llm=lambda sys, usr: "not json").source == "template"


def test_timeout_falls_back():
    def boom(sys, usr):
        raise TimeoutError

    assert explain(S1, llm=boom).source == "template"


def test_retry_recovers_after_one_bad_answer():
    answers = iter([WRONG, GOOD])
    calls = []

    def llm(sys, usr):
        calls.append(usr)
        return next(answers)

    assert explain(S1, llm=llm).source == "model"
    assert len(calls) == 2
    assert "rejected" in calls[1]


@pytest.mark.parametrize("path", FILES, ids=lambda p: p.name)
def test_template_always_validates(path):
    s = load(path.name)
    e = template_explanation(s)
    assert validate(e.text, s, e.numbers_used) == []
