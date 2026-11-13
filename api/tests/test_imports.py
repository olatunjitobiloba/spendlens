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
