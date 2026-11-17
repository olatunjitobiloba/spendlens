"""Unit tests for pure speech-to-text transcription engine (ai.transcription)."""

import pytest

from ai.transcription import MockSpeechTranscriber, get_default_transcriber


@pytest.mark.asyncio
async def test_mock_transcriber_empty_bytes():
    transcriber = MockSpeechTranscriber()
    res = await transcriber.transcribe(b"", "note.webm", "audio/webm")
    assert res == ""


@pytest.mark.asyncio
async def test_mock_transcriber_custom_text():
    transcriber = MockSpeechTranscriber(default_text="Custom query?")
    res = await transcriber.transcribe(b"some-audio", "note.webm", "audio/webm")
    assert res == "Custom query?"


@pytest.mark.asyncio
async def test_mock_transcriber_deterministic_sample():
    transcriber = MockSpeechTranscriber()
    # Length % 4 will select one of SAMPLE_TRANSCRIPTS
    res1 = await transcriber.transcribe(b"1234", "note.webm", "audio/webm")
    assert isinstance(res1, str)
    assert len(res1) > 0


def test_get_default_transcriber_fallback(monkeypatch):
    # Ensure neither GROQ_API_KEY nor OPENAI_API_KEY is set
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    transcriber = get_default_transcriber()
    assert isinstance(transcriber, MockSpeechTranscriber)
