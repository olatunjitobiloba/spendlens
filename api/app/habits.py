"""Habits and emotional spend auditing endpoint."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ai.habits import HabitAudit, analyze_habits

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1", tags=["habits"])


@router.get("/habits", response_model=HabitAudit)
async def get_habits(
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> HabitAudit:
    """Audits transaction timing to detect late-night debits, weekend surges, and micro-drains."""
    gateway = SupabaseGateway(settings, user.token)
    try:
        txns = await gateway.select(
            "transactions",
            {"select": "amount_kobo,direction,category,timestamp,created_at,description", "direction": "eq.debit"},
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not load transactions") from exc

    return analyze_habits(txns)
