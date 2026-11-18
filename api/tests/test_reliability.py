from fastapi.testclient import TestClient

from api.app.config import Settings, get_settings
from api.app.main import app
from api.app.reliability import import_limit


def test_every_response_has_an_opaque_request_id():
    app.dependency_overrides[get_settings] = lambda: Settings(None, None, None)
    try:
        response = TestClient(app).get("/health", headers={"X-Request-ID": "demo-request-1"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "demo-request-1"


def test_import_preview_rate_limits_one_requester():
    import_limit._hits.clear()
    client = TestClient(app)
    try:
        for _ in range(10):
            response = client.post("/v1/imports/preview")
            assert response.status_code == 422
        limited = client.post("/v1/imports/preview")
    finally:
        import_limit._hits.clear()

    assert limited.status_code == 429
    assert limited.headers["Retry-After"] == "60"
