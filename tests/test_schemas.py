import json
from pathlib import Path

import pytest

from ai.schemas import Explanation, ScenarioResult

FIXTURES = Path(__file__).parent.parent / "fixtures"
FILES = sorted(FIXTURES.glob("scenario_*.json"))


def test_fixtures_found():
    assert len(FILES) >= 5


@pytest.mark.parametrize("path", FILES, ids=lambda p: p.name)
def test_fixture_validates_and_math_holds(path):
    s = ScenarioResult.model_validate(json.loads(path.read_text()))
    for c in s.categories:
        assert c.reduction_kobo == c.total_kobo * c.percent // 100
    assert s.total_reduction_kobo == sum(c.reduction_kobo for c in s.categories)
    assert s.baseline_kobo == sum(c.total_kobo for c in s.categories)
    assert not set(s.protected_categories) & {c.category for c in s.categories}


def test_explanation_defaults():
    e = Explanation(text="x", numbers_used=[1])
    assert e.source == "model"
