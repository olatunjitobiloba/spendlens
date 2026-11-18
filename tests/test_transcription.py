"""Unit tests for pure speech-to-text transcription engine (ai.transcription)."""

import asyncio

import httpx
import pytest

from ai.transcription import (
    APIWhisperTranscriber,
    FallbackTranscriber,
    GeminiSpeechTranscriber,
    MockSpeechTranscriber,
    get_default_transcriber,
)


def test_mock_transcriber_empty_bytes():
    transcriber = MockSpeechTranscriber()
    res = asyncio.run(transcriber.transcribe(b"", "note.webm", "audio/webm"))
    assert res == ""


def test_mock_transcriber_custom_text():
    transcriber = MockSpeechTranscriber(default_text="Custom query?")
    res = asyncio.run(transcriber.transcribe(b"some-audio", "note.webm", "audio/webm"))
    assert res == "Custom query?"


def test_mock_transcriber_deterministic_sample():
    transcriber = MockSpeechTranscriber()
    # Length % 4 will select one of SAMPLE_TRANSCRIPTS
    res1 = asyncio.run(transcriber.transcribe(b"1234", "note.webm", "audio/webm"))
    assert isinstance(res1, str)
    assert len(res1) > 0


def test_get_default_transcriber_fallback(monkeypatch):
    # Ensure no API keys are set
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    transcriber = get_default_transcriber()
    assert isinstance(transcriber, MockSpeechTranscriber)


def test_fallback_transcriber_recovers_from_error():
    class BrokenTranscriber:
        async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
            raise RuntimeError("API failure")

    mock = MockSpeechTranscriber(default_text="Fallback text")
    resilient = FallbackTranscriber(primary=BrokenTranscriber(), fallback=mock)
    res = asyncio.run(resilient.transcribe(b"audio", "note.webm", "audio/webm"))
    assert res == "Fallback text"


def test_gemini_transcriber_empty_bytes():
    transcriber = GeminiSpeechTranscriber(api_key="test-key")
    res = asyncio.run(transcriber.transcribe(b"", "note.webm", "audio/webm"))
    assert res == ""


def test_gemini_transcriber_success(monkeypatch):
    captured_req = {}

    async def mock_post(self, url, headers=None, json=None, **kwargs):
        captured_req["url"] = str(url)
        captured_req["headers"] = headers
        captured_req["json"] = json
        req = httpx.Request("POST", str(url))
        return httpx.Response(
            200,
            request=req,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Where did all my money go this month?"}]
                        }
                    }
                ]
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

    transcriber = GeminiSpeechTranscriber(api_key="gemini-secret-123", model="gemini-2.5-flash")
    result = asyncio.run(
        transcriber.transcribe(
            audio_bytes=b"raw-audio-bytes",
            filename="voice.webm",
            content_type="audio/webm;codecs=opus",
        )
    )

    assert result == "Where did all my money go this month?"
    assert "gemini-2.5-flash:generateContent" in captured_req["url"]
    assert captured_req["headers"]["x-goog-api-key"] == "gemini-secret-123"
    inline_data = captured_req["json"]["contents"][0]["parts"][0]["inlineData"]
    assert inline_data["mimeType"] == "audio/webm"
    assert len(inline_data["data"]) > 0


def test_gemini_transcriber_mime_inference(monkeypatch):
    captured_req = {}

    async def mock_post(self, url, headers=None, json=None, **kwargs):
        captured_req["json"] = json
        req = httpx.Request("POST", str(url))
        return httpx.Response(
            200,
            request=req,
            json={"candidates": [{"content": {"parts": [{"text": "Inferred audio test"}]}}]},
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

    transcriber = GeminiSpeechTranscriber(api_key="gemini-secret-123")
    res = asyncio.run(
        transcriber.transcribe(
            audio_bytes=b"wav-bytes",
            filename="recording.wav",
            content_type="application/octet-stream",
        )
    )
    assert res == "Inferred audio test"
    assert captured_req["json"]["contents"][0]["parts"][0]["inlineData"]["mimeType"] == "audio/wav"


def test_gemini_transcriber_empty_candidates(monkeypatch):
    async def mock_post(self, url, headers=None, json=None, **kwargs):
        req = httpx.Request("POST", str(url))
        return httpx.Response(200, request=req, json={"candidates": []})

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    transcriber = GeminiSpeechTranscriber(api_key="gemini-secret-123")
    res = asyncio.run(transcriber.transcribe(b"audio", "recording.webm", "audio/webm"))
    assert res == ""


def test_gemini_transcriber_null_content_safety_block(monkeypatch):
    """When Gemini returns candidates with null content (e.g. safety finishReason)."""
    async def mock_post(self, url, headers=None, json=None, **kwargs):
        req = httpx.Request("POST", str(url))
        return httpx.Response(200, request=req, json={"candidates": [{"content": None, "finishReason": "SAFETY"}]})

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    transcriber = GeminiSpeechTranscriber(api_key="gemini-secret-123")
    res = asyncio.run(transcriber.transcribe(b"audio", "recording.webm", "audio/webm"))
    assert res == ""


def test_get_default_transcriber_gemini_only(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test-key")

    transcriber = get_default_transcriber()
    assert isinstance(transcriber, FallbackTranscriber)
    assert isinstance(transcriber.primary, GeminiSpeechTranscriber)
    assert isinstance(transcriber.fallback, MockSpeechTranscriber)


def test_get_default_transcriber_groq_and_gemini_hierarchy(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "groq-test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    transcriber = get_default_transcriber()
    assert isinstance(transcriber, FallbackTranscriber)
    # Primary must be Groq Whisper
    assert isinstance(transcriber.primary, APIWhisperTranscriber)
    # Fallback must be another FallbackTranscriber wrapping Gemini and Mock
    assert isinstance(transcriber.fallback, FallbackTranscriber)
    assert isinstance(transcriber.fallback.primary, GeminiSpeechTranscriber)
    assert isinstance(transcriber.fallback.fallback, MockSpeechTranscriber)


def test_groq_to_gemini_live_failover(monkeypatch):
    """When Groq fails with 429 Too Many Requests, it automatically falls back to Gemini."""
    monkeypatch.setenv("GROQ_API_KEY", "groq-test-key")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-test-key")

    async def mock_post(self, url, headers=None, json=None, files=None, data=None, **kwargs):
        url_str = str(url)
        req = httpx.Request("POST", url_str)
        if "groq.com" in url_str:
            # Simulate Groq 429 Rate Limit
            return httpx.Response(429, request=req, json={"error": {"message": "Rate limit reached"}})
        if "generativelanguage.googleapis.com" in url_str:
            return httpx.Response(
                200,
                request=req,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [{"text": "Gemini fallback transcript"}]
                            }
                        }
                    ]
                },
            )
        raise RuntimeError(f"Unexpected URL: {url_str}")

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

    transcriber = get_default_transcriber()
    res = asyncio.run(transcriber.transcribe(b"test-audio-bytes", "note.webm", "audio/webm"))
    assert res == "Gemini fallback transcript"


