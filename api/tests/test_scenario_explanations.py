from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.db import SupabaseGateway
from api.app.main import app


SCENARIO_ID = "4fabf66c-3689-4a83-a4c1-c5b1404a0b5b"
STORED_SCENARIO = {
    "data_revision": "revision-1",
    "range": {"start": "2026-01-01", "end": "2026-01-31"},
    "baseline_kobo": 100_000,
    "categories": [{"category": "Food", "total_kobo": 100_000, "percent": 20, "reduction_kobo": 20_000}],
    "total_reduction_kobo": 20_000,
    "remaining_kobo": 80_000,
    "protected_categories": ["Rent"],
    "coverage_warnings": [],
    "evidence_txn_ids": [],
}


def _configure_app():
    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)


def test_explanation_loads_only_the_requested_owner_scoped_scenario(monkeypatch):
    captured = {}

    async def fake_rpc(self, function, payload):
        captured["function"] = function
        captured["payload"] = payload
        return STORED_SCENARIO

    def fallback(payload):
        assert payload["baseline_kobo"] == 100_000
        return {"text": "Standard summary.", "numbers_used": [20_000], "source": "template"}

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    monkeypatch.setattr("api.app.analysis.explain_scenario", fallback)
    try:
        response = TestClient(app).post(f"/v1/scenarios/{SCENARIO_ID}/explanation")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["source"] == "template"
    assert captured == {"function": "get_scenario", "payload": {"p_scenario_id": SCENARIO_ID}}


def test_explanation_returns_404_when_scenario_is_not_owned_or_missing(monkeypatch):
    async def fake_rpc(self, function, payload):
        return None

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(f"/v1/scenarios/{SCENARIO_ID}/explanation")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
