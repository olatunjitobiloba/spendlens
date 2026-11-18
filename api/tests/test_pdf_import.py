import pytest

from api.app.pdf_import import canonical_csv_from_pdf


class _Page:
    def __init__(self, text: str):
        self.text = text

    def extract_text(self):
        return self.text


class _Reader:
    is_encrypted = False

    def __init__(self, pages):
        self.pages = pages


def test_text_pdf_extracts_only_canonical_csv_rows(monkeypatch):
    monkeypatch.setattr(
        "api.app.pdf_import.PdfReader",
        lambda _: _Reader([
            _Page("Statement\ndate,description,amount,direction,bank\n2026-01-01,Uber,1500.50,debit,GTBank\nPage 1"),
        ]),
    )

    assert canonical_csv_from_pdf(b"%PDF") == (
        b"date,description,amount,direction,bank\n2026-01-01,Uber,1500.50,debit,GTBank\n"
    )


def test_scanned_or_noncanonical_pdf_is_rejected(monkeypatch):
    monkeypatch.setattr("api.app.pdf_import.PdfReader", lambda _: _Reader([_Page("")]))

    with pytest.raises(ValueError, match="selectable text"):
        canonical_csv_from_pdf(b"%PDF")


def test_password_protected_pdf_is_rejected_without_prompt(monkeypatch):
    reader = _Reader([])
    reader.is_encrypted = True
    monkeypatch.setattr("api.app.pdf_import.PdfReader", lambda _: reader)

    with pytest.raises(ValueError, match="password-protected"):
        canonical_csv_from_pdf(b"%PDF")
