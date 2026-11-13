"""Deterministic analysis, protections, and scenario endpoints."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1", tags=["analysis"])


class DateRange(BaseModel):
    start: date
    end: date


class ProtectionsUpdate(BaseModel):
    categories: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("categories")
    @classmethod
    def normalize_categories(cls, categories: list[str]) -> list[str]:
        cleaned = [category.strip() for category in categories if category.strip()]
        if len(cleaned) != len(set(cleaned)):
            raise ValueError("categories must be unique")
        return cleaned


class CategoryReduction(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    percent: int = Field(ge=0, le=100)


class ScenarioRequest(DateRange):
    reductions: list[CategoryReduction] = Field(min_length=1, max_length=20)

    @field_validator("reductions")
    @classmethod
    def unique_categories(cls, reductions: list[CategoryReduction]) -> list[CategoryReduction]:
        categories = [row.category for row in reductions]
        if len(categories) != len(set(categories)):
            raise ValueError("each category may appear once")
        return reductions


async def _rpc(
    function: str, payload: dict, user: CurrentUser, settings: Settings
) -> dict:
    try:
        result = await SupabaseGateway(settings, user.token).rpc(function, payload)
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Calculation unavailable") from exc
    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Calculation unavailable")
    return result


@router.get("/analysis")
async def get_analysis(
    start: date,
    end: date,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    if start > end:
        raise HTTPException(status_code=422, detail="start must not be after end")
    return await _rpc(
        "get_analysis", {"p_start": start.isoformat(), "p_end": end.isoformat()}, user, settings
    )


@router.put("/protections")
async def set_protections(
    update: ProtectionsUpdate,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    return await _rpc("set_protections", {"p_categories": update.categories}, user, settings)


@router.post("/scenarios")
async def calculate_scenario(
    scenario: ScenarioRequest,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    if scenario.start > scenario.end:
        raise HTTPException(status_code=422, detail="start must not be after end")
    result = await _rpc(
        "calculate_scenario",
        {
            "p_start": scenario.start.isoformat(),
            "p_end": scenario.end.isoformat(),
            "p_reductions": [reduction.model_dump() for reduction in scenario.reductions],
        },
        user,
        settings,
    )
    if result.get("error") == "protected_category":
        raise HTTPException(status_code=422, detail="A protected category cannot be reduced")
    return result
