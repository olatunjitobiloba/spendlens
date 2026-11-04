import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from ai.api import explain_scenario

FIXTURES = Path(__file__).parent.parent / "fixtures"


def payload():
    return json.loads((FIXTURES / "scenario_01.json").read_text())


def boom(system, user):
    raise TimeoutError


def test_json_in_json_out():
    out = explain_scenario(payload(), llm=boom)
    assert set(out) == {"text", "numbers_used", "source"}
    assert out["source"] == "template"


def test_missing_field_raises():
    p = payload()
    del p["remaining_kobo"]
    with pytest.raises(ValidationError):
        explain_scenario(p, llm=boom)


def test_explain_scenario_logs_source_and_timing(caplog):
    import logging

    with caplog.at_level(logging.INFO, logger="spendlens.ai"):
        out = explain_scenario(payload(), llm=boom)
        assert out["source"] == "template"
    assert any("explain source=template ms=" in record.message for record in caplog.records)


