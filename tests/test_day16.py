import pytest
from pydantic import ValidationError

from ai.goals import GoalInput, project_goal


def base(**kw):
    d = dict(
        goal_name="Laptop",
        target_kobo=100_000_00,
        saved_kobo=0,
        monthly_saving_kobo=10_000_00,
        annual_rate_pct=0,
    )
    d.update(kw)
    return GoalInput(**d)


def test_no_rate_exact_months():
    assert project_goal(base()).months_to_goal == 10


def test_already_reached():
    assert project_goal(base(saved_kobo=100_000_00)).months_to_goal == 0


def test_rate_reaches_sooner_or_equal():
    assert project_goal(base(annual_rate_pct=12)).months_to_goal <= 10


def test_zero_saving_never_reaches():
    assert project_goal(base(monthly_saving_kobo=0)).months_to_goal is None


def test_validation_rejects_negative_or_empty():
    with pytest.raises(ValidationError):
        GoalInput(
            goal_name="",
            target_kobo=100,
            saved_kobo=0,
            monthly_saving_kobo=10,
        )

    with pytest.raises(ValidationError):
        base(target_kobo=0)

    with pytest.raises(ValidationError):
        base(annual_rate_pct=105)
