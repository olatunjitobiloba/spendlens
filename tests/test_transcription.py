"""Unit tests for pure speech-to-text transcription engine (ai.transcription)."""

import asyncio

from ai.transcription import FallbackTranscriber, MockSpeechTranscriber, get_default_transcriber


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
    # Ensure neither GROQ_API_KEY nor OPENAI_API_KEY is set
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
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

