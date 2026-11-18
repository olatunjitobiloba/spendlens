"""Safe extraction of canonical transaction rows from text-native PDFs."""

from __future__ import annotations

import io

from pypdf import PdfReader

from .csv_import import MAX_BYTES


def canonical_csv_from_pdf(content: bytes) -> bytes:
    """Extract a literal canonical CSV table from a text-native PDF.

    Bank PDF layouts are not standardized. To avoid silently assigning columns
    incorrectly, this first supported format requires the readable PDF to carry
    the same comma-delimited header and rows accepted by the CSV importer.
    Scanned, encrypted, image-only, and non-canonical PDFs are rejected.
    """
    if len(content) > MAX_BYTES:
        raise ValueError("file exceeds 5 MB limit")
    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as exc:
        raise ValueError("file is not a readable PDF") from exc
    if reader.is_encrypted:
        raise ValueError("password-protected PDFs are not supported")

    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages)
    if not text.strip():
        raise ValueError("PDF must contain selectable text; scanned PDFs are not supported")

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    try:
        first = next(index for index, line in enumerate(lines) if _is_canonical_header(line))
    except StopIteration as exc:
        raise ValueError(
            "PDF must include the canonical CSV header: date, description, amount, direction, bank"
        ) from exc

    rows = [lines[first]]
    for line in lines[first + 1 :]:
        # Keep only literal CSV rows. Page headings/footers are ignored rather
        # than guessed as financial transactions.
        if line.count(",") >= 4:
            rows.append(line)
    if len(rows) == 1:
        raise ValueError("PDF contains no canonical transaction rows")
    return ("\n".join(rows) + "\n").encode("utf-8")


def _is_canonical_header(line: str) -> bool:
    headers = [part.strip() for part in line.split(",")]
    required = {"date", "description", "amount", "direction", "bank"}
    return required.issubset(headers)
