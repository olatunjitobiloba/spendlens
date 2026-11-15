"""Chat endpoint: answers questions about spending, categories, and savings plans."""

from __future__ import annotations

from typing import Any, Callable, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ai.api import chat_reply
from ai.llm import complete

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1", tags=["chat"])


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=500)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    history: list[ChatTurn] = Field(default_factory=list, max_length=6)
    ctx: dict[str, Any] | None = None


class ChatReply(BaseModel):
    answer: str
    source: Literal["model", "refusal"]
    tool_calls: int


def get_llm() -> Callable[..., str]:
    return complete


@router.post("/chat", response_model=ChatReply)
async def post_chat(
    req: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    llm: Callable[..., str] = Depends(get_llm),
) -> ChatReply:
    # If client passed an explicit context (e.g. from a scenario), use it directly.
    ctx = req.ctx
    if not ctx:
        gateway = SupabaseGateway(settings, user.token)
        try:
            txns = await gateway.select(
                "transactions",
                {"select": "amount_kobo,direction,category,status", "direction": "eq.debit"},
            )
            prots = await gateway.select("protections", {"select": "category"})
        except DatabaseError as exc:
            raise HTTPException(status_code=502, detail="Could not load financial context") from exc

        protected_categories = [p["category"] for p in prots if isinstance(p, dict) and "category" in p]
        categories: dict[str, int] = {}
        baseline_kobo = 0
        for t in txns:
            amt = int(t.get("amount_kobo") or 0)
            cat = t.get("category") or "Uncategorised"
            categories[cat] = categories.get(cat, 0) + amt
            baseline_kobo += amt

        ctx = {
            "baseline_kobo": baseline_kobo,
            "total_reduction_kobo": 0,
            "remaining_kobo": baseline_kobo,
            "categories": categories,
            "protected": protected_categories,
            "cuts": [],
        }

    payload = {
        "ctx": ctx,
        "message": req.message,
        "history": [turn.model_dump() for turn in req.history],
    }

    try:
        reply = chat_reply(payload, llm=llm)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return ChatReply(
        answer=reply["answer"],
        source=reply["source"],
        tool_calls=reply["tool_calls"],
    )
