"""Pure speech-to-text transcription engine.

Supports Groq Whisper, OpenAI Whisper, Gemini, and deterministic mock fallback.
Follows zero-data logging guidelines: audio bytes and transcription texts are never logged.
"""

from __future__ import annotations

import os
from typing import Protocol

import httpx

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB

SAMPLE_TRANSCRIPTS = [
    "How much did I spend this month?",
    "Where did most of my money go?",
    "How much money came in this month?",
    "Which categories are protected?",
]


class SpeechTranscriber(Protocol):
    """Protocol for speech transcription implementations."""

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        """Transcribe audio bytes to text."""
        ...


class MockSpeechTranscriber:
    """Offline deterministic speech transcriber used when no API keys are configured."""

    def __init__(self, default_text: str | None = None) -> None:
        self.default_text = default_text

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        if not audio_bytes:
            return ""
        if self.default_text:
            return self.default_text
        # Deterministically select sample transcript based on length
        index = len(audio_bytes) % len(SAMPLE_TRANSCRIPTS)
        return SAMPLE_TRANSCRIPTS[index]


class APIWhisperTranscriber:
    """Speech transcriber calling an OpenAI-compatible Whisper endpoint (Groq or OpenAI)."""

    def __init__(self, base_url: str, api_key: str, model: str = "whisper-large-v3") -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        if not audio_bytes:
            return ""

        url = f"{self.base_url}/audio/transcriptions"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        safe_filename = filename or "voice-note.webm"
        files = {
            "file": (safe_filename, audio_bytes, content_type or "audio/webm"),
        }
        data = {
            "model": self.model,
            "response_format": "json",
            "temperature": "0",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, files=files, data=data)
            resp.raise_for_status()
            result = resp.json()
            return str(result.get("text", "")).strip()


def get_default_transcriber() -> SpeechTranscriber:
    """Factory selecting the best available transcriber from environment variables.

    1. Groq Whisper (ultra-fast, free tier available).
    2. OpenAI Whisper.
    3. MockSpeechTranscriber fallback if no API keys are configured.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        return APIWhisperTranscriber(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model="whisper-large-v3",
        )

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return APIWhisperTranscriber(
            base_url="https://api.openai.com/v1",
            api_key=openai_key,
            model="whisper-1",
        )

    # Deterministic fallback for local development, CI, and test environments
    return MockSpeechTranscriber()
