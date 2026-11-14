"""User-scoped transaction review and duplicate-candidate decisions."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1", tags=["transactions"])

SELECT_COLUMNS = (
    "id,import_id,txn_date,txn_time,description,amount_kobo,direction,bank,"
    "account_alias,reference,category,category_source,category_confidence,review_state,status"
)


class TransactionPage(BaseModel):
    items: list[dict]
    page: int
    page_size: int


class TransactionUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=80)
    review_state: Literal["unreviewed", "reviewed"] | None = None

    @model_validator(mode="after")
    def has_change(self) -> "TransactionUpdate":
        if self.category is None and self.review_state is None:
            raise ValueError("provide category or review_state")
        return self


class ReconciliationDecision(BaseModel):
    candidate_id: UUID
    state: Literal["confirmed", "rejected"]


@router.get("/transactions", response_model=TransactionPage)
async def list_transactions(
    start: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    category: str | None = Query(default=None, max_length=80),
    bank: str | None = Query(default=None, max_length=80),
    review_state: Literal["unreviewed", "reviewed"] | None = None,
    status: str | None = Query(default=None, max_length=40),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> TransactionPage:
    params = {
        "select": SELECT_COLUMNS,
        "order": "txn_date.desc,id.desc",
        "limit": str(page_size),
        "offset": str((page - 1) * page_size),
    }
    if start:
        params["txn_date"] = f"gte.{start}"
    if end:
        params["txn_date"] = f"lte.{end}"
    if category:
        params["category"] = f"eq.{category}"
    if bank:
        params["bank"] = f"eq.{bank}"
    if review_state:
        params["review_state"] = f"eq.{review_state}"
    if status:
        params["status"] = f"eq.{status}"
    try:
        rows = await SupabaseGateway(settings, user.token).select("transactions", params)
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not load transactions") from exc
    return TransactionPage(items=rows, page=page, page_size=page_size)


@router.patch("/transactions/{transaction_id}")
async def update_transaction(
    transaction_id: UUID,
    update: TransactionUpdate,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    values = update.model_dump(exclude_none=True)
    if "category" in values:
        values.update({"category_source": "user", "category_confidence": 1.0})
    try:
        rows = await SupabaseGateway(settings, user.token).update(
            "transactions", {"id": f"eq.{transaction_id}"}, values
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not update transaction") from exc
    if not rows:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return rows[0]


@router.post("/reconciliation/confirm")
async def confirm_reconciliation(
    decision: ReconciliationDecision,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        result = await SupabaseGateway(settings, user.token).rpc(
            "set_reconciliation_state",
            {"p_candidate_id": str(decision.candidate_id), "p_state": decision.state},
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=404, detail="Candidate not found") from exc
    return result
