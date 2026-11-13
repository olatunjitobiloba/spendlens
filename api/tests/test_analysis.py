from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.db import SupabaseGateway
from api.app.main import app


def _configure_app():
    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)


def test_scenario_sends_integer_reduction_contract_to_database(monkeypatch):
    captured = {}

    async def fake_rpc(self, function, payload):
        captured["function"] = function
        captured["payload"] = payload
        return {"baseline_kobo": 1_000_000, "total_reduction_kobo": 200_000}

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/scenarios",
            json={
                "start": "2026-01-01",
                "end": "2026-01-31",
                "reductions": [{"category": "Food", "percent": 20}],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["function"] == "calculate_scenario"
    assert captured["payload"]["p_reductions"] == [{"category": "Food", "percent": 20}]


def test_protected_scenario_returns_422(monkeypatch):
    async def fake_rpc(self, function, payload):
        return {"error": "protected_category"}

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/scenarios",
            json={
                "start": "2026-01-01",
                "end": "2026-01-31",
                "reductions": [{"category": "Health", "percent": 10}],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
