"""Speech-to-text transcriptions endpoint for Voice AI."""

from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from ai.transcription import (
    MAX_AUDIO_BYTES,
    SpeechTranscriber,
    get_default_transcriber,
)

from .auth import CurrentUser, get_current_user

router = APIRouter(prefix="/v1", tags=["transcriptions"])


class TranscriptionReply(BaseModel):
    text: str


def get_transcriber() -> SpeechTranscriber:
    """Dependency provider for speech transcriber."""
    return get_default_transcriber()


@router.post("/chat/transcriptions", response_model=TranscriptionReply)
async def post_transcription(
    file: Annotated[UploadFile, File(...)],
    user: CurrentUser = Depends(get_current_user),
    transcriber: SpeechTranscriber = Depends(get_transcriber),
) -> TranscriptionReply:
    """Accepts a recorded voice note audio file and returns its transcribed text."""
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=422, detail="The voice note was empty.")

    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file exceeds {MAX_AUDIO_BYTES // (1024 * 1024)}MB limit.",
        )

    try:
        text = await transcriber.transcribe(
            audio_bytes=content,
            filename=file.filename or "voice-note.webm",
            content_type=file.content_type or "audio/webm",
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Transcription service unavailable.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to process voice note.") from exc

    return TranscriptionReply(text=text)
