import json
import logging
from pathlib import Path

import pytest
from pydantic import ValidationError

from ai.api import chat_reply
from tests.test_chat_tools import CTX


def test_valid_payload_returns_answer():
    replies = iter(
        [
            json.dumps({"tool": "get_summary", "args": {}}),
            json.dumps({"answer": "You keep ₦95,500.00."}),
        ]
    )
    out = chat_reply({"ctx": CTX, "message": "left?"}, llm=lambda s, u: next(replies))
    assert out["source"] == "model"
    assert out["tool_calls"] == 1


def test_missing_ctx_key_is_rejected():
    bad = {k: v for k, v in CTX.items() if k != "cuts"}
    with pytest.raises(ValidationError):
        chat_reply({"ctx": bad, "message": "hi"})


def test_empty_and_long_messages_are_rejected():
    for msg in ("", "x" * 501):
        with pytest.raises(ValidationError):
            chat_reply({"ctx": CTX, "message": msg})


def test_chat_reply_logs_metadata_only(caplog):
    replies = iter(
        [
            json.dumps({"tool": "get_summary", "args": {}}),
            json.dumps({"answer": "You keep ₦95,500.00."}),
        ]
    )
    secret_msg = "super secret private text"
    with caplog.at_level(logging.INFO, logger="spendlens.ai"):
        out = chat_reply(
            {"ctx": CTX, "message": secret_msg}, llm=lambda s, u: next(replies)
        )
        assert out["source"] == "model"

    assert any(
        "chat source=model calls=1 ms=" in record.message for record in caplog.records
    )
    # Ensure raw user message text is NEVER logged
    assert all(secret_msg not in record.message for record in caplog.records)


def test_chat_reply_accepts_scenario_fixture():
    fixture_path = Path(__file__).parent.parent / "fixtures" / "scenario_01.json"
    scenario = json.loads(fixture_path.read_text())
    replies = iter(
        [
            json.dumps({"tool": "get_summary", "args": {}}),
            json.dumps({"answer": "You keep ₦163,000.00."}),
        ]
    )
    out = chat_reply(
        {"ctx": scenario, "message": "what is remaining?"},
        llm=lambda s, u: next(replies),
    )
    assert out["source"] == "model"
