import json
from pathlib import Path
from unittest.mock import patch

from scripts.smoke import main

FIXTURES = Path(__file__).parent.parent / "fixtures"


def test_smoke_script_all_ok(monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"text": "Savings calculated.", "source": "model"}

    def fake_post(url, json, timeout):
        return FakeResponse()

    monkeypatch.setattr("httpx.post", fake_post)
    exit_code = main("http://testserver/explain")
    assert exit_code == 0


def test_smoke_script_reports_bad_on_error(monkeypatch):
    def fake_post(url, json, timeout):
        raise RuntimeError("Server connection error")

    monkeypatch.setattr("httpx.post", fake_post)
    exit_code = main("http://testserver/explain")
    assert exit_code == 1

