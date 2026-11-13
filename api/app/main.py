from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ai.goals import GoalInput, GoalProjection, project_goal

from .csv_import import ImportPreview, parse_preview
from .config import get_settings
from .imports import router as imports_router

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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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
