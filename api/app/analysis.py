"""Analysis endpoint: category breakdowns, monthly totals, and coverage."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from ai.analysis import calculate_analysis

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1", tags=["analysis"])


@router.get("/analysis")
async def get_analysis(
    start: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    compare: Literal["previous"] | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    gateway = SupabaseGateway(settings, user.token)
    try:
        txns = await gateway.select(
            "transactions",
            {
                "select": "id,txn_date,description,amount_kobo,direction,bank,category,review_state,status,import_id",
                "order": "txn_date.asc,id.asc",
            },
        )
        prots = await gateway.select("protections", {"select": "category"})
        imports = await gateway.select(
            "imports",
            {"select": "id,content_hash,period_start,period_end,created_at", "order": "created_at.desc"},
        )
        candidates = await gateway.select(
            "reconciliation_links",
            {"select": "id,kind,txn_ids,state", "state": "eq.candidate"},
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not load analysis data") from exc

    protected_categories = [p["category"] for p in prots if isinstance(p, dict) and "category" in p]
    return calculate_analysis(
        transactions=txns,
        protections=protected_categories,
        imports=imports,
        reconciliation_candidates=candidates,
        start=start,
        end=end,
        compare=compare,
    )
