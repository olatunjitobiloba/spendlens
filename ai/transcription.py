"""Pure speech-to-text transcription engine.

Supports Groq Whisper, OpenAI Whisper, Gemini, and deterministic mock fallback.
Follows zero-data logging guidelines: audio bytes and transcription texts are never logged.
"""

from __future__ import annotations

import base64
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


class GeminiSpeechTranscriber:
    """Multimodal speech transcriber using Google Gemini generateContent API."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.5-flash",
        timeout: float = 20.0,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        if not audio_bytes:
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

        # Normalize audio MIME type (stripping codec params like ";codecs=opus")
        raw_mime = (content_type or "audio/webm").split(";")[0].strip().lower()
        if raw_mime in ("application/octet-stream", "", "binary/octet-stream"):
            fn = (filename or "").lower()
            if fn.endswith(".wav"):
                mime = "audio/wav"
            elif fn.endswith(".mp3"):
                mime = "audio/mp3"
            elif fn.endswith((".m4a", ".aac")):
                mime = "audio/m4a"
            elif fn.endswith(".ogg"):
                mime = "audio/ogg"
            elif fn.endswith(".flac"):
                mime = "audio/flac"
            else:
                mime = "audio/webm"
        else:
            mime = raw_mime

        b64_data = base64.b64encode(audio_bytes).decode("utf-8")
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": mime,
                                "data": b64_data,
                            }
                        },
                        {
                            "text": (
                                "Please transcribe the speech in this audio recording verbatim. "
                                "Output only the exact transcribed speech with no commentary, explanation, "
                                "conversational filler, introductory remarks, or formatting."
                            )
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return ""
            content = candidates[0].get("content") or {}
            parts = content.get("parts") or []
            text_parts = [p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p]
            return "".join(text_parts).strip()


class FallbackTranscriber:
    """Wraps a primary transcriber with an offline fallback for resilience."""

    def __init__(self, primary: SpeechTranscriber, fallback: SpeechTranscriber) -> None:
        self.primary = primary
        self.fallback = fallback

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        try:
            text = await self.primary.transcribe(audio_bytes, filename, content_type)
            if text and text.strip():
                return text.strip()
        except Exception:
            pass
        return await self.fallback.transcribe(audio_bytes, filename, content_type)


def get_default_transcriber() -> SpeechTranscriber:
    """Factory selecting the best available transcriber from environment variables.

    Chains providers with automatic fallback:
    1. Groq Whisper (ultra-fast, free tier available)
    2. Google Gemini (multimodal audio understanding, free tier available)
    3. OpenAI Whisper (fallback if configured)
    4. MockSpeechTranscriber fallback if no API keys are configured or all fail.
    """
    mock = MockSpeechTranscriber()
    current: SpeechTranscriber = mock

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        openai_transcriber = APIWhisperTranscriber(
            base_url="https://api.openai.com/v1",
            api_key=openai_key,
            model="whisper-1",
        )
        current = FallbackTranscriber(primary=openai_transcriber, fallback=current)

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        gemini_model = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
        gemini_transcriber = GeminiSpeechTranscriber(
            api_key=gemini_key,
            model=gemini_model,
        )
        current = FallbackTranscriber(primary=gemini_transcriber, fallback=current)

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        groq_transcriber = APIWhisperTranscriber(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model="whisper-large-v3",
        )
        current = FallbackTranscriber(primary=groq_transcriber, fallback=current)

    return current
