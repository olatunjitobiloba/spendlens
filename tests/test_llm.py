from unittest.mock import patch

import pytest

from ai import llm


def test_blank_optional_model_vars_fall_back_to_defaults(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test")
    monkeypatch.setenv("GROQ_MODEL", "")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    with patch("ai.llm._call_provider", return_value="{}") as mock_call:
        out = llm.complete("sys", "usr")

    assert out == "{}"
    assert mock_call.call_args.kwargs["model"] == "llama-3.3-70b-versatile"


def test_blank_llm_api_key_is_treated_as_unset(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("LLM_API_KEY", "")

    with pytest.raises(KeyError, match="No LLM API keys configured"):
        llm.complete("sys", "usr")
