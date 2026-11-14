from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.db import SupabaseGateway
from api.app.main import app


CSV = b"""date,description,amount,direction,bank\n2026-01-01,Uber trip,1500.50,debit,GTBank\n2026-01-01,Uber trip,1500.50,debit,GTBank\n"""


def test_commit_uses_one_rpc_with_enriched_rows_and_duplicate_candidates(monkeypatch):
    captured = {}

    async def fake_rpc(self, function, payload):
        captured["function"] = function
        captured["payload"] = payload
        return {"id": "8a1c8b4c-1b67-4470-848b-36f8bb94e7ce", "reused": False}

    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/imports",
            headers={"Idempotency-Key": "import-1"},
            files={"file": ("transactions.csv", CSV, "text/csv")},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["function"] == "commit_import"
    assert len(captured["payload"]["p_transactions"]) == 2
    assert captured["payload"]["p_transactions"][1]["status"] == "Possible duplicate"
    assert captured["payload"]["p_duplicate_candidates"][0]["txn_source_rows"] == [2, 3]


def test_commit_returns_the_import_record_the_web_app_renders(monkeypatch):
    async def fake_rpc(self, function, payload):
        return {"id": "8a1c8b4c-1b67-4470-848b-36f8bb94e7ce", "reused": False}

    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)
    monkeypatch.setattr(SupabaseGateway, "rpc", fake_rpc)
    try:
        response = TestClient(app).post(
            "/v1/imports",
            headers={"Idempotency-Key": "import-2"},
            files={"file": ("statement.csv", CSV, "application/octet-stream")},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "statement.csv"
    assert body["row_count"] == 2
    assert body["date_range"] == {"start": "2026-01-01", "end": "2026-01-01"}
    assert body["coverage_warnings"] == []
    assert body["created_at"]


def test_preview_returns_the_shape_the_web_app_renders():
    response = TestClient(app).post(
        "/v1/imports/preview", files={"file": ("statement.csv", CSV, "text/csv")}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "statement.csv"
    assert body["date_range"] == {"start": "2026-01-01", "end": "2026-01-01"}
    assert body["errors"] == []
    assert body["coverage_warnings"] == []
    assert body["sample_rows"][0]["amount_kobo"] == 150050
    assert body["sample_rows"][0]["account"] == "Primary"


def test_preview_accepts_excel_bom_and_untyped_uploads():
    excel_csv = "﻿Date, Description ,Amount,Direction,Bank\r\n2026-01-01,Uber trip,1500.50,debit,GTBank\r\n"
    for content_type in ("application/octet-stream", "text/plain", ""):
        response = TestClient(app).post(
            "/v1/imports/preview",
            files={"file": ("statement.csv", excel_csv.encode("utf-8"), content_type)},
        )
        assert response.status_code == 200, (content_type, response.text)
        assert response.json()["valid_count"] == 1


def test_preview_rejects_files_that_are_plainly_not_csv():
    response = TestClient(app).post(
        "/v1/imports/preview", files={"file": ("photo.csv", b"\x89PNG", "image/png")}
    )
    assert response.status_code == 415
