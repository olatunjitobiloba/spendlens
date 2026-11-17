"""Tests for /v1/chat/transcriptions endpoint."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.app.auth import CurrentUser, get_current_user
from api.app.main import app
from api.app.transcriptions import get_transcriber


class FakeTranscriber:
    """Deterministic fake transcriber for testing."""

    def __init__(self, reply: str = "Where did most of my money go?"):
        self.reply = reply
        self.called_with: bytes | None = None

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        self.called_with = audio_bytes
        return self.reply


@pytest.fixture
def auth_override():
    """Overrides get_current_user to return a mock authenticated user."""
    mock_user = CurrentUser(id="user_test_voice", token="token_123")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield mock_user
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def transcriber_override():
    """Overrides get_transcriber with a deterministic fake."""
    fake = FakeTranscriber()
    app.dependency_overrides[get_transcriber] = lambda: fake
    yield fake
    app.dependency_overrides.pop(get_transcriber, None)


def test_transcription_requires_auth():
    """Unauthenticated calls must return 401."""
    client = TestClient(app)
    # Ensure no override for auth is active
    app.dependency_overrides.pop(get_current_user, None)
    files = {"file": ("voice-note.webm", b"fake-audio-bytes", "audio/webm")}
    resp = client.post("/v1/chat/transcriptions", files=files)
    assert resp.status_code == 401
    assert "Bearer token required" in resp.json()["detail"]


def test_transcription_rejects_empty_file(auth_override, transcriber_override):
    """Empty files must return 422."""
    client = TestClient(app)
    files = {"file": ("voice-note.webm", b"", "audio/webm")}
    resp = client.post("/v1/chat/transcriptions", files=files)
    assert resp.status_code == 422
    assert "empty" in resp.json()["detail"].lower()


def test_transcription_rejects_oversized_file(auth_override, transcriber_override):
    """Files over 10MB must return 413."""
    client = TestClient(app)
    # 10MB + 1 byte
    large_audio = b"0" * (10 * 1024 * 1024 + 1)
    files = {"file": ("voice-note.webm", large_audio, "audio/webm")}
    resp = client.post("/v1/chat/transcriptions", files=files)
    assert resp.status_code == 413
    assert "exceeds" in resp.json()["detail"].lower()


def test_transcription_success(auth_override, transcriber_override):
    """Valid audio returns expected transcription text."""
    client = TestClient(app)
    audio_content = b"fake-audio-recording-data"
    files = {"file": ("voice-note.webm", audio_content, "audio/webm")}
    resp = client.post("/v1/chat/transcriptions", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert "text" in data
    assert data["text"] == "Where did most of my money go?"
    assert transcriber_override.called_with == audio_content


def test_transcription_service_failure(auth_override):
    """Service errors from transcriber must return 502."""
    class FailingTranscriber:
        async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
            import httpx
            raise httpx.ConnectError("Could not reach speech provider")

    app.dependency_overrides[get_transcriber] = lambda: FailingTranscriber()
    client = TestClient(app)
    files = {"file": ("voice-note.webm", b"audio-data", "audio/webm")}
    resp = client.post("/v1/chat/transcriptions", files=files)
    assert resp.status_code == 502
    assert "unavailable" in resp.json()["detail"].lower()
    app.dependency_overrides.pop(get_transcriber, None)

