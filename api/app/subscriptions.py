"""Subscription detection and cancellation assistant endpoint."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ai.subscriptions import SubscriptionItem, scan_subscriptions

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1", tags=["subscriptions"])


@router.get("/subscriptions", response_model=list[SubscriptionItem])
async def get_subscriptions(
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> list[SubscriptionItem]:
    """Returns detected recurring subscriptions enriched with one-click cancellation aids."""
    gateway = SupabaseGateway(settings, user.token)
    try:
        txns = await gateway.select(
            "transactions",
            {"select": "amount_kobo,direction,description,date,txn_date", "direction": "eq.debit"},
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not load transactions") from exc

    return scan_subscriptions(txns)
