"""Integration tests for habits, subscriptions, and investments endpoints."""

import pytest
from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.main import app


@pytest.fixture
def auth_override():
    user = CurrentUser(id="user_intel_test", token="token_intel_123")
    app.dependency_overrides[get_current_user] = lambda: user
    # Mock settings so supabase is marked ready
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://fake.supabase.co",
        supabase_anon_key="fake-anon-key",
        allowed_origin=None,
    )
    yield user
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_settings, None)


def test_habits_endpoint_requires_auth():
    client = TestClient(app)
    app.dependency_overrides.pop(get_current_user, None)
    resp = client.get("/v1/habits")
    assert resp.status_code == 401


def test_subscriptions_endpoint_requires_auth():
    client = TestClient(app)
    app.dependency_overrides.pop(get_current_user, None)
    resp = client.get("/v1/subscriptions")
    assert resp.status_code == 401


def test_investments_suggestions_requires_auth():
    client = TestClient(app)
    app.dependency_overrides.pop(get_current_user, None)
    resp = client.get("/v1/investments/suggestions")
    assert resp.status_code == 401


def test_investments_suggestions_success(auth_override):
    client = TestClient(app)
    resp = client.get("/v1/investments/suggestions?monthly_spare_kobo=4000000&horizon_months=12")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    first = data[0]
    assert "title" in first
    assert "benchmark_annual_rate_pct" in first
    assert "projected_growth_kobo" in first
    assert "regulatory_body" in first


def test_investments_project_public():
    client = TestClient(app)
    payload = {"monthly_kobo": 5000000, "months": 12, "annual_rate_pct": 16.0}
    resp = client.post("/v1/investments/project", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_principal_kobo"] == 60000000
    assert data["total_future_value_kobo"] > 60000000
    assert data["gain_kobo"] > 0
