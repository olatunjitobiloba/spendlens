import pytest
from fastapi.testclient import TestClient

from api.app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_goal_projection_is_non_advisory():
    response = client.post(
        "/v1/goals/project",
        json={
            "goal_name": "Emergency fund",
            "target_kobo": 100_000,
            "saved_kobo": 0,
            "monthly_saving_kobo": 50_000,
            "annual_rate_pct": 0,
        },
    )

    assert response.status_code == 200
    assert response.json()["months_to_goal"] == 2
    assert "not a forecast or advice" in response.json()["note"]


def test_analysis_route_exists():
    response = client.get("/v1/analysis")
    assert response.status_code != 404


def test_chat_route_exists():
    response = client.post("/v1/chat", json={})
    assert response.status_code != 404


def test_settings_allowed_origins_splits_comma_separated():
    from api.app.config import Settings

    s1 = Settings(None, None, "https://spendlensng.vercel.app, https://spendlens-preview.vercel.app")
    assert s1.allowed_origins == [
        "https://spendlensng.vercel.app",
        "https://spendlens-preview.vercel.app",
    ]

    s2 = Settings(None, None, None)
    assert s2.allowed_origins == []


def test_settings_allowed_origin_regex():
    from api.app.config import Settings

    regex = r"^https://spendlens-.*-oluwatobilobas-projects-65dcaf29\.vercel\.app$"
    s = Settings(None, None, None, regex)
    assert s.allowed_origin_regex == regex

