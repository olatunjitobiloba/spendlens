from __future__ import annotations

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ai.goals import GoalInput, GoalProjection, project_goal

from .csv_import import ImportPreview, parse_preview
from .config import get_settings
from .imports import router as imports_router
from .transactions import router as transactions_router
from .analysis import router as analysis_router
from .billing import router as billing_router
from .db import database_health
from .privacy import router as privacy_router

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
app.include_router(analysis_router)
app.include_router(billing_router)
app.include_router(privacy_router)


@app.get("/health")
async def health(settings=Depends(get_settings)) -> dict[str, str]:
    if not settings.supabase_ready:
        return {"status": "ok", "database": "not_configured"}
    if not await database_health(settings):
        raise HTTPException(status_code=503, detail="database unavailable")
    return {"status": "ok", "database": "ok"}


@app.post("/v1/imports/preview", response_model=ImportPreview)
async def preview_import(file: UploadFile = File(...)) -> ImportPreview:
    if file.content_type not in {"text/csv", "application/vnd.ms-excel", None}:
        raise HTTPException(status_code=415, detail="file must be CSV")
    content = await file.read()
    try:
        return parse_preview(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/v1/goals/project", response_model=GoalProjection)
def goal_projection(goal: GoalInput) -> GoalProjection:
    return project_goal(goal)
