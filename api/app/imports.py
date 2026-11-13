"""Persist reviewed imports through a single transactional Supabase RPC."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .csv_import import prepare_commit
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1/imports", tags=["imports"])


class ImportCommit(BaseModel):
    id: str
    reused: bool


@router.post("", response_model=ImportCommit)
async def commit_import(
    file: UploadFile = File(...),
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=1, max_length=128),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> ImportCommit:
    if file.content_type not in {"text/csv", "application/vnd.ms-excel", None}:
        raise HTTPException(status_code=415, detail="file must be CSV")
    try:
        preview, transactions, duplicate_candidates = prepare_commit(await file.read())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if preview.errors:
        raise HTTPException(status_code=422, detail={"errors": preview.errors})

    try:
        result = await SupabaseGateway(settings, user.token).rpc(
            "commit_import",
            {
                "p_content_hash": preview.content_hash,
                "p_idempotency_key": idempotency_key,
                "p_transactions": transactions,
                "p_duplicate_candidates": duplicate_candidates,
                "p_period_start": preview.period_start.isoformat() if preview.period_start else None,
                "p_period_end": preview.period_end.isoformat() if preview.period_end else None,
            },
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not save import") from exc
    return ImportCommit.model_validate(result)
