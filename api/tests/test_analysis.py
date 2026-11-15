from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.config import Settings, get_settings
from api.app.db import DatabaseError, SupabaseGateway
from api.app.main import app

client = TestClient(app)


def _configure_app():
    app.dependency_overrides[get_current_user] = lambda: CurrentUser("user-1", "token")
    app.dependency_overrides[get_settings] = lambda: Settings("https://example.test", "anon", None)


def test_get_analysis_returns_totals_and_categories(monkeypatch):
    sample_txns = [
        {
            "id": "t1",
            "txn_date": "2026-02-05",
            "description": "Lunch at restaurant",
            "amount_kobo": 50000,
            "direction": "debit",
            "bank": "gtbank",
            "category": "Food",
            "review_state": "reviewed",
            "status": "OK",
            "import_id": "imp-1",
        },
        {
            "id": "t2",
            "txn_date": "2026-02-10",
            "description": "Uber ride",
            "amount_kobo": 30000,
            "direction": "debit",
            "bank": "gtbank",
            "category": "Transport",
            "review_state": "reviewed",
            "status": "OK",
            "import_id": "imp-1",
        },
        {
            "id": "t3",
            "txn_date": "2026-02-01",
            "description": "Monthly Salary",
            "amount_kobo": 200000,
            "direction": "credit",
            "bank": "gtbank",
            "category": "Income",
            "review_state": "reviewed",
            "status": "OK",
            "import_id": "imp-1",
        },
    ]

    async def fake_select(self, table, params):
        if table == "transactions":
            return sample_txns
        if table == "protections":
            return [{"category": "Rent"}]
        if table == "imports":
            return [{"id": "imp-1", "content_hash": "hash1", "period_start": "2026-02-01", "period_end": "2026-02-28", "created_at": "2026-02-15T00:00:00Z"}]
        if table == "reconciliation_links":
            return []
        return []

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "select", fake_select)
    try:
        response = client.get("/v1/analysis?start=2026-02-01&end=2026-02-28")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total_spent_kobo"] == 80000
    assert data["total_income_kobo"] == 200000
    assert data["txn_count"] == 3
    assert len(data["categories"]) == 2
    assert data["categories"][0]["category"] == "Food"
    assert data["categories"][0]["total_kobo"] == 50000
    assert data["categories"][0]["share_pct"] == 62.5
    assert data["categories"][1]["category"] == "Transport"
    assert data["categories"][1]["total_kobo"] == 30000
    assert data["categories"][1]["share_pct"] == 37.5
    assert data["coverage"]["days_with_data"] == 3


def test_get_analysis_handles_database_error(monkeypatch):
    async def fake_select_fail(self, table, params):
        raise DatabaseError("Supabase connection timeout")

    _configure_app()
    monkeypatch.setattr(SupabaseGateway, "select", fake_select_fail)
    try:
        response = client.get("/v1/analysis")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 502
    assert response.json()["detail"] == "Could not load analysis data"
