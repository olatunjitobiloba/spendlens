from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.db import SupabaseGateway
from api.app.main import app


def _configure_app():
    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)


def test_list_transactions_uses_pagination_and_filters(monkeypatch):
    captured = {}

    async def fake_select(self, table, params):
        captured["table"] = table
        captured["params"] = params
        return [{"id": "transaction-1", "amount_kobo": 12500, "bank": "gtbank", "status": "OK"}]

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "select", fake_select)
    try:
        response = TestClient(app).get("/v1/transactions?category=Food&page=2&page_size=10")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["page"] == 2
    assert captured["table"] == "transactions"
    assert captured["params"]["offset"] == "10"
    assert captured["params"]["category"] == "eq.Food"


def test_category_correction_records_user_source(monkeypatch):
    captured = {}

    async def fake_update(self, table, filters, values):
        captured["table"] = table
        captured["filters"] = filters
        captured["values"] = values
        return [{"id": "ec2e99be-3ee7-44a5-a43d-39fdab3b6d42", **values}]

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "update", fake_update)
    try:
        response = TestClient(app).patch(
            "/v1/transactions/ec2e99be-3ee7-44a5-a43d-39fdab3b6d42",
            json={"category": "Food"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["table"] == "transactions"
    assert captured["values"] == {
        "category": "Food",
        "category_source": "user",
        "category_confidence": 1.0,
    }
