import io
import json
from unittest.mock import patch

import pytest

from scripts.smoke_deploy import check_health, main


class _FakeResponse:
    def __init__(self, status: int, payload: bytes):
        self.status = status
        self._buf = io.BytesIO(payload)

    def read(self) -> bytes:
        return self._buf.read()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


def test_check_health_passes_and_normalizes_health_suffix():
    body = json.dumps({"status": "ok", "database": "ok"}).encode("utf-8")
    with patch("urllib.request.urlopen", return_value=_FakeResponse(200, body)) as mock_open:
        out = check_health("https://spendlens.onrender.com/health/")
    assert out["status"] == "ok"
    req = mock_open.call_args.args[0]
    assert req.full_url == "https://spendlens.onrender.com/health"


@pytest.mark.parametrize("bad_url", ["file:///etc/passwd", "https://", "https://example.com?a=1"])
def test_check_health_rejects_invalid_urls(bad_url):
    with pytest.raises(ValueError, match="Invalid http/https base URL"):
        check_health(bad_url)


@pytest.mark.parametrize(
    "status,payload,exc_type",
    [
        (503, b'{"status":"ok"}', AssertionError),
        (200, b"not-json", json.JSONDecodeError),
        (200, b'["ok"]', AssertionError),
        (200, b'{"status":"degraded"}', AssertionError),
    ],
)
def test_check_health_rejects_bad_responses(status, payload, exc_type):
    with patch("urllib.request.urlopen", return_value=_FakeResponse(status, payload)):
        with pytest.raises(exc_type):
            check_health("https://spendlens.onrender.com")


def test_main_returns_exit_codes(capsys):
    assert main([]) == 2

    body = json.dumps({"status": "ok"}).encode("utf-8")
    with patch("urllib.request.urlopen", return_value=_FakeResponse(200, body)):
        assert main(["https://spendlens.onrender.com"]) == 0
    assert "backend ok" in capsys.readouterr().out

    with patch("urllib.request.urlopen", side_effect=OSError("timed out")):
        assert main(["https://spendlens.onrender.com"]) == 1
