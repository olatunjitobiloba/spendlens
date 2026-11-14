"""CSV import preview and commit. The response shapes match web/types/api.ts."""

from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .csv_import import ImportPreview, parse_preview, prepare_commit
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1/imports", tags=["imports"])

# Browsers label .csv files inconsistently: Windows without Excel sends
# application/octet-stream, some send text/plain or nothing. The parser is the
# real check; this only turns away uploads that are plainly something else.
CSV_CONTENT_TYPES = {
    "",
    "text/csv",
    "text/plain",
    "text/x-csv",
    "application/csv",
    "application/x-csv",
    "application/vnd.ms-excel",
    "application/octet-stream",
}


class DateRange(BaseModel):
    start: date
    end: date


class RowError(BaseModel):
    line: int
    message: str


class SampleRow(BaseModel):
    date: date
    description: str
    amount_kobo: int
    direction: str
    account: str
    bank: str | None
    category: str | None


class PreviewResponse(BaseModel):
    filename: str
    row_count: int
    valid_count: int
    date_range: DateRange | None
    accounts: list[str]
    errors: list[RowError]
    sample_rows: list[SampleRow]
    coverage_warnings: list[str]


class ImportRecord(BaseModel):
    id: str
    filename: str
    row_count: int
    date_range: DateRange | None
    created_at: datetime
    coverage_warnings: list[str]
    reused: bool


def _date_range(preview: ImportPreview) -> DateRange | None:
    if preview.period_start is None or preview.period_end is None:
        return None
    return DateRange(start=preview.period_start, end=preview.period_end)


async def _read_csv(file: UploadFile) -> bytes:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in CSV_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="file must be CSV")
    return await file.read()


@router.post("/preview", response_model=PreviewResponse)
async def preview_import(file: UploadFile = File(...)) -> PreviewResponse:
    content = await _read_csv(file)
    try:
        preview = parse_preview(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return PreviewResponse(
        filename=file.filename or "upload.csv",
        row_count=preview.row_count,
        valid_count=preview.valid_count,
        date_range=_date_range(preview),
        accounts=preview.accounts,
        errors=preview.errors,
        sample_rows=preview.sample_rows,
        coverage_warnings=preview.coverage_warnings,
    )


@router.post("", response_model=ImportRecord)
async def commit_import(
    file: UploadFile = File(...),
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=1, max_length=128),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> ImportRecord:
    content = await _read_csv(file)
    try:
        preview, transactions, duplicate_candidates = prepare_commit(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if preview.errors:
        first = preview.errors[0]
        raise HTTPException(
            status_code=422,
            detail=f"Line {first['line']}: {first['message']}. Fix the file and import it again.",
        )

    try:
        result = await SupabaseGateway(settings, user.token).rpc(
            "commit_import",
            {
                "p_content_hash": preview.content_hash,
                "p_idempotency_key": idempotency_key,
                "p_transactions": transactions,
                "p_duplicate_candidates": duplicate_candidates,
                "p_period_start": preview.period_start.isoformat() if preview.period_start else None,
                "p_period_end": preview.period_end.isoformat() if preview.period_end else None,
            },
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not save import") from exc
    return ImportRecord(
        id=str(result["id"]),
        filename=file.filename or "upload.csv",
        row_count=preview.row_count,
        date_range=_date_range(preview),
        created_at=datetime.now(timezone.utc),
        coverage_warnings=preview.coverage_warnings,
        reused=bool(result.get("reused", False)),
    )
