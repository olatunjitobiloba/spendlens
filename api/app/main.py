from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai.goals import GoalInput, GoalProjection, project_goal

from .config import get_settings
from .imports import router as imports_router
from .transactions import router as transactions_router

app = FastAPI(title="SpendLens API", version="0.1.0")
settings = get_settings()
if settings.allowed_origin:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.allowed_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
app.include_router(imports_router)
app.include_router(transactions_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/goals/project", response_model=GoalProjection)
def goal_projection(goal: GoalInput) -> GoalProjection:
    return project_goal(goal)
