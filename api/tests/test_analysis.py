from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.db import DatabaseError, SupabaseGateway
from api.app.main import app


def _configure_app():
    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)


def test_scenario_creates_owner_scoped_record_with_integer_reductions(monkeypatch):
    captured = {}

    async def fake_rpc(self, function, payload):
        captured["function"] = function
        captured["payload"] = payload
        return {"id": "4fabf66c-3689-4a83-a4c1-c5b1404a0b5b", "baseline_kobo": 1_000_000}

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/scenarios",
            json={
                "range": {"start": "2026-01-01", "end": "2026-01-31"},
                "cuts": [{"category": "Food", "percent": 20}],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["function"] == "create_scenario"
    assert captured["payload"]["p_reductions"] == [{"category": "Food", "percent": 20}]
    assert captured["payload"]["p_save"] is False


def test_protected_scenario_returns_422(monkeypatch):
    async def fake_rpc(self, function, payload):
        return {"error": "protected_category"}

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/scenarios",
            json={
                "range": {"start": "2026-01-01", "end": "2026-01-31"},
                "cuts": [{"category": "Health", "percent": 10}],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_save_scenario_sets_pro_flag_and_keeps_the_name(monkeypatch):
    captured = {}

    async def fake_rpc(self, function, payload):
        captured["function"] = function
        captured["payload"] = payload
        return {"id": "scenario-1", "saved": True}

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/scenarios",
            json={
                "range": {"start": "2026-01-01", "end": "2026-01-31"},
                "cuts": [{"category": "Food", "percent": 20}],
                "save": True,
                "name": " January reset ",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["function"] == "create_scenario"
    assert captured["payload"]["p_name"] == "January reset"
    assert captured["payload"]["p_save"] is True


def test_list_saved_scenarios_uses_ownership_scoped_rpc(monkeypatch):
    async def fake_rpc(self, function, payload):
        assert function == "list_saved_scenarios"
        assert payload == {}
        return [{"id": "scenario-1", "saved": True}]

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).get("/v1/scenarios")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == [{"id": "scenario-1", "saved": True}]


def test_saving_without_an_active_pro_entitlement_returns_402(monkeypatch):
    async def fake_rpc(self, function, payload):
        raise DatabaseError("pro_required")

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/scenarios",
            json={
                "range": {"start": "2026-01-01", "end": "2026-01-31"},
                "cuts": [{"category": "Food", "percent": 20}],
                "save": True,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 402
    assert response.json()["detail"] == "pro_required"
