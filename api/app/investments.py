"""Goal-based investment opportunity matching and projections endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from ai.investments import (
    InvestmentOption,
    InvestmentProjection,
    project_investment_growth,
    suggest_investments,
)

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings

router = APIRouter(prefix="/v1/investments", tags=["investments"])


class ProjectionInput(BaseModel):
    monthly_kobo: int = Field(ge=0, description="Monthly amount to save/invest in kobo")
    months: int = Field(ge=1, le=120, default=12, description="Investment horizon in months")
    annual_rate_pct: float = Field(ge=0.0, le=100.0, default=16.5, description="Benchmark yield percentage")


@router.get("/suggestions", response_model=list[InvestmentOption])
async def get_investment_suggestions(
    monthly_spare_kobo: Annotated[int, Query(ge=0)] = 2500000,
    horizon_months: Annotated[int, Query(ge=1, le=120)] = 12,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> list[InvestmentOption]:
    """Recommends legitimate Nigerian investment asset classes based on spare savings and goal timeframe."""
    return suggest_investments(
        monthly_spare_kobo=monthly_spare_kobo,
        horizon_months=horizon_months,
    )


@router.post("/project", response_model=InvestmentProjection)
def post_investment_projection(req: ProjectionInput) -> InvestmentProjection:
    """Calculates compound future value and interest gain for recurring contributions."""
    return project_investment_growth(
        monthly_kobo=req.monthly_kobo,
        months=req.months,
        annual_rate_pct=req.annual_rate_pct,
    )
