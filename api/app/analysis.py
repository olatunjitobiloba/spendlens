"""Deterministic analysis, protections, and scenario endpoints."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from ai.api import explain_scenario
from ai.schemas import Explanation, ScenarioResult
from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway
from .reliability import explanation_limit

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


class ScenarioRequest(BaseModel):
    range: DateRange
    cuts: list[CategoryReduction] = Field(min_length=1, max_length=20)
    save: bool = False
    name: str | None = Field(default=None, max_length=60)

    @field_validator("cuts")
    @classmethod
    def unique_categories(cls, cuts: list[CategoryReduction]) -> list[CategoryReduction]:
        categories = [row.category for row in cuts]
        if len(categories) != len(set(categories)):
            raise ValueError("each category may appear once")
        return cuts

    @field_validator("name")
    @classmethod
    def normalize_name(cls, name: str | None) -> str | None:
        return name.strip() if name and name.strip() else None


async def _rpc(
    function: str, payload: dict, user: CurrentUser, settings: Settings
) -> dict:
    try:
        result = await SupabaseGateway(settings, user.token).rpc(function, payload)
    except DatabaseError as exc:
        if function == "create_scenario" and "pro_required" in str(exc):
            raise HTTPException(status_code=402, detail="pro_required") from exc
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
    if scenario.range.start > scenario.range.end:
        raise HTTPException(status_code=422, detail="start must not be after end")
    payload = {
        "p_start": scenario.range.start.isoformat(),
        "p_end": scenario.range.end.isoformat(),
        "p_reductions": [cut.model_dump() for cut in scenario.cuts],
    }
    payload["p_save"] = scenario.save
    payload["p_name"] = scenario.name
    result = await _rpc("create_scenario", payload, user, settings)
    if result.get("error") == "protected_category":
        raise HTTPException(status_code=422, detail="A protected category cannot be reduced")
    return result


@router.get("/scenarios")
async def list_saved_scenarios(
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> list[dict]:
    try:
        result = await SupabaseGateway(settings, user.token).rpc("list_saved_scenarios", {})
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not load saved scenarios") from exc
    if not isinstance(result, list):
        raise HTTPException(status_code=502, detail="Could not load saved scenarios")
    return result


@router.post("/scenarios/{scenario_id}/explanation", response_model=Explanation, dependencies=[Depends(explanation_limit)])
async def explain_saved_scenario(
    scenario_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> Explanation:
    """Explain only the stored calculation belonging to the authenticated user."""
    try:
        stored = await SupabaseGateway(settings, user.token).rpc(
            "get_scenario", {"p_scenario_id": str(scenario_id)}
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not load scenario") from exc
    if not isinstance(stored, dict):
        raise HTTPException(status_code=404, detail="Scenario not found")
    return Explanation.model_validate(explain_scenario(ScenarioResult.model_validate(stored).model_dump()))
