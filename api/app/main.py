from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai.goals import GoalInput, GoalProjection, project_goal

from .analysis import router as analysis_router
from .chat import router as chat_router
from .config import get_settings
from .imports import router as imports_router
from .transactions import router as transactions_router

app = FastAPI(title="SpendLens API", version="0.1.0")
settings = get_settings()
cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.allowed_origins:
    cors_kwargs["allow_origins"] = settings.allowed_origins
if settings.allowed_origin_regex:
    cors_kwargs["allow_origin_regex"] = settings.allowed_origin_regex

if settings.allowed_origins or settings.allowed_origin_regex:
    app.add_middleware(CORSMiddleware, **cors_kwargs)
app.include_router(imports_router)
app.include_router(transactions_router)
app.include_router(analysis_router)
app.include_router(chat_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/goals/project", response_model=GoalProjection)
def goal_projection(goal: GoalInput) -> GoalProjection:
    return project_goal(goal)
