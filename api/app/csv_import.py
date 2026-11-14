"""Pure CSV validation and ML enrichment for transaction imports."""

from __future__ import annotations

import csv
import hashlib
import io
from dataclasses import dataclass
from datetime import date, time, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from ai.banks import normalize_bank
from ai.duplicates import find_duplicates, statuses
from ml.categorize import categorize
from ml.types import Txn

MAX_BYTES = 5 * 1024 * 1024
MAX_ROWS = 5_000
REQUIRED_HEADERS = frozenset({"date", "description", "amount", "direction", "bank"})
OPTIONAL_HEADERS = frozenset({"account_alias", "reference", "currency", "time"})
SAMPLE_ROWS = 6
COVERAGE_GAP_DAYS = 7


@dataclass(frozen=True)
class ImportRow:
    source_row: int
    txn: Txn


@dataclass(frozen=True)
class ImportPreview:
    row_count: int
    valid_count: int
    period_start: date | None
    period_end: date | None
    accounts: list[str]
    errors: list[dict[str, str | int]]
    content_hash: str
    sample_rows: list[dict[str, object]]
    coverage_warnings: list[str]


def parse_preview(content: bytes) -> ImportPreview:
    """Validate a canonical SpendLens CSV without persisting its contents."""
    if len(content) > MAX_BYTES:
        raise ValueError("file exceeds 5 MB limit")
    reader = _reader(content)
    headers = {header for header in reader.fieldnames or [] if header}
    missing = REQUIRED_HEADERS - headers
    unknown = headers - REQUIRED_HEADERS - OPTIONAL_HEADERS
    if missing:
        raise ValueError(f"missing required headers: {', '.join(sorted(missing))}")
    if unknown:
        raise ValueError(f"unsupported headers: {', '.join(sorted(unknown))}")

    valid_rows: list[ImportRow] = []
    errors: list[dict[str, str | int]] = []
    row_count = 0
    for line_number, row in enumerate(reader, start=2):
        row_count += 1
        if row_count > MAX_ROWS:
            raise ValueError("file exceeds 5,000 row limit")
        try:
            valid_rows.append(_parse_row(row, line_number))
        except ValueError as exc:
            errors.append({"line": line_number, "message": str(exc)})

    dates = [row.txn.date for row in valid_rows]
    accounts = sorted({row.txn.account_alias for row in valid_rows})
    sample = [row.txn for row in valid_rows[:SAMPLE_ROWS]]
    sample_categories = {result.txn_id: result.category for result in categorize(sample)}
    return ImportPreview(
        row_count=row_count,
        valid_count=len(valid_rows),
        period_start=min(dates) if dates else None,
        period_end=max(dates) if dates else None,
        accounts=accounts,
        errors=errors,
        content_hash=hashlib.sha256(_normalized_csv(content)).hexdigest(),
        sample_rows=[
            {
                "date": txn.date.isoformat(),
                "description": txn.description,
                "amount_kobo": txn.amount_kobo,
                "direction": txn.direction,
                "account": txn.account_alias,
                "bank": txn.bank,
                "category": sample_categories.get(txn.id),
            }
            for txn in sample
        ],
        coverage_warnings=coverage_warnings(dates),
    )


def coverage_warnings(dates: list[date]) -> list[str]:
    """Flag runs of 7+ days with no transactions inside the file's date range."""
    if not dates:
        return []
    have = sorted(set(dates))
    warnings: list[str] = []
    for before, after in zip(have, have[1:]):
        missing = (after - before).days - 1
        if missing >= COVERAGE_GAP_DAYS:
            start, end = before + timedelta(days=1), after - timedelta(days=1)
            warnings.append(
                f"No transactions for {missing} days in this range ({start.isoformat()} to {end.isoformat()})."
            )
    return warnings


def parse_and_enrich(content: bytes) -> tuple[ImportPreview, list[dict[str, object]]]:
    """Produce the transaction values that a commit route will persist."""
    preview, transactions, _ = prepare_commit(content)
    return preview, transactions


def prepare_commit(content: bytes) -> tuple[ImportPreview, list[dict[str, object]], list[dict[str, object]]]:
    """Produce transaction and duplicate-candidate values for one atomic commit."""
    preview = parse_preview(content)
    if preview.errors:
        return preview, [], []

    reader = _reader(content)
    rows = [_parse_row(row, line) for line, row in enumerate(reader, start=2)]
    txns = [row.txn for row in rows]
    categories = categorize(txns)
    duplicates = find_duplicates(txns)
    transaction_statuses = statuses(duplicates, categories)
    categories_by_id = {result.txn_id: result for result in categories}

    transactions = [
        {
            "source_row": row.source_row,
            "txn_date": row.txn.date.isoformat(),
            "txn_time": row.txn.time.isoformat() if row.txn.time else None,
            "description": row.txn.description,
            "amount_kobo": row.txn.amount_kobo,
            "direction": row.txn.direction,
            "bank": row.txn.bank,
            "account_alias": row.txn.account_alias,
            "reference": row.txn.reference,
            "category": categories_by_id[row.txn.id].category,
            "category_confidence": categories_by_id[row.txn.id].confidence,
            "status": transaction_statuses.get(row.txn.id, "OK"),
        }
        for row in rows
    ]
    candidates = [
        {
            "kind": candidate["kind"],
            "txn_source_rows": [int(transaction_id) for transaction_id in candidate["txn_ids"]],
        }
        for candidate in duplicates
    ]
    return preview, transactions, candidates


def _parse_row(row: dict[str, str | None], line_number: int) -> ImportRow:
    def field(name: str, default: str = "") -> str:
        return (row.get(name) or default).strip()

    try:
        txn_date = date.fromisoformat(field("date"))
    except ValueError as exc:
        raise ValueError("date must use YYYY-MM-DD") from exc
    raw_time = field("time")
    try:
        txn_time = time.fromisoformat(raw_time) if raw_time else None
    except ValueError as exc:
        raise ValueError("time must use HH:MM[:SS]") from exc

    description = field("description")
    if not description:
        raise ValueError("description is required")
    currency = field("currency", "NGN").upper()
    if currency != "NGN":
        raise ValueError("currency must be NGN")
    direction = field("direction").lower()
    if direction not in {"debit", "credit"}:
        raise ValueError("direction must be debit or credit")
    try:
        amount = Decimal(field("amount"))
    except InvalidOperation as exc:
        raise ValueError("amount must be a decimal number") from exc
    if not amount.is_finite() or amount <= 0:
        raise ValueError("amount must be greater than zero")
    amount_kobo = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    account_alias = field("account_alias", "Primary")
    bank = normalize_bank(field("bank"))

    return ImportRow(
        source_row=line_number,
        txn=Txn(
            id=str(line_number),
            date=txn_date,
            time=txn_time,
            description=description,
            amount_kobo=amount_kobo,
            direction=direction,
            account_alias=account_alias,
            reference=field("reference") or None,
            bank=bank,
        ),
    )


def _normalized_csv(content: bytes) -> bytes:
    """Normalize line endings only; rows remain distinct, including duplicates."""
    return _decode(content).replace("\r\n", "\n").strip().encode("utf-8")


def _decode(content: bytes) -> str:
    # utf-8-sig drops the byte-order mark Excel writes when saving "CSV UTF-8".
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("file must be UTF-8") from exc


def _reader(content: bytes) -> csv.DictReader:
    reader = csv.DictReader(io.StringIO(_decode(content), newline=""))
    # Match header names case- and whitespace-insensitively, for rows too.
    reader.fieldnames = [(name or "").strip().lower() for name in reader.fieldnames or []]
    return reader
