import json
import logging

from fastapi.testclient import TestClient

from ai.chat import REFUSAL
from api.app.auth import CurrentUser, get_current_user
from api.app.chat import get_llm
from api.app.config import Settings, get_settings
from api.app.db import SupabaseGateway
from api.app.main import app

client = TestClient(app)


def _configure_app():
    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)


def test_chat_returns_grounded_answer(monkeypatch):
    async def fake_select(self, table, params):
        if table == "transactions":
            return [
                {"amount_kobo": 4500000, "direction": "debit", "category": "Food", "status": "OK"},
                {"amount_kobo": 5500000, "direction": "debit", "category": "Rent", "status": "OK"},
            ]
        if table == "protections":
            return [{"category": "Rent"}]
        return []

    replies = iter(
        [
            json.dumps({"tool": "get_summary", "args": {}}),
            json.dumps({"answer": "You keep ₦100,000.00."}),
        ]
    )

    _configure_app()
    app.dependency_overrides[get_llm] = lambda: lambda s, u: next(replies)
    monkeypatch.setattr(SupabaseGateway, "select", fake_select)
    try:
        response = client.post("/v1/chat", json={"message": "How much is left?"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "model"
    assert "₦100,000" in data["answer"]
    assert data["tool_calls"] == 1


def test_chat_refuses_investment_and_ungrounded_advice(monkeypatch):
    async def fake_select(self, table, params):
        return []

    # LLM attempts to give speculative crypto/stock investment advice with invented numbers
    def rogue_llm(s, u):
        return json.dumps({"answer": "You should invest 50% into Bitcoin and crypto."})

    _configure_app()
    app.dependency_overrides[get_llm] = lambda: rogue_llm
    monkeypatch.setattr(SupabaseGateway, "select", fake_select)
    try:
        response = client.post(
            "/v1/chat",
            json={"message": "Where should I invest my savings?"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "refusal"
    assert data["answer"] == REFUSAL


def test_chat_never_logs_sensitive_user_message(caplog, monkeypatch):
    async def fake_select(self, table, params):
        return []

    replies = iter(
        [
            json.dumps({"tool": "get_summary", "args": {}}),
            json.dumps({"answer": "You keep ₦0.00."}),
        ]
    )

    secret_message = "My private transaction secret details 12345"
    _configure_app()
    app.dependency_overrides[get_llm] = lambda: lambda s, u: next(replies)
    monkeypatch.setattr(SupabaseGateway, "select", fake_select)

    with caplog.at_level(logging.INFO):
        response = client.post("/v1/chat", json={"message": secret_message})

    app.dependency_overrides.clear()
    assert response.status_code == 200
    # Strict privacy: raw user text must never be logged anywhere
    for record in caplog.records:
        assert secret_message not in record.message
