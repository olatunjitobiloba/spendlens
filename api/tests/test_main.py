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
