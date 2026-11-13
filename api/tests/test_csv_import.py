from api.app.csv_import import parse_and_enrich, parse_preview


CSV = b"""date,description,amount,direction,bank,account_alias,reference\n2026-01-01,Uber trip,1500.50,debit,GTBank,Main,abc\n2026-01-01,Uber trip,1500.50,debit,GTBank,Main,abc\n"""


def test_preview_returns_counts_and_normalized_hash():
    preview = parse_preview(CSV)

    assert preview.row_count == 2
    assert preview.valid_count == 2
    assert preview.period_start.isoformat() == "2026-01-01"
    assert preview.accounts == ["Main"]
    assert len(preview.content_hash) == 64


def test_enrichment_returns_bank_and_duplicate_status_without_removing_rows():
    preview, rows = parse_and_enrich(CSV)

    assert preview.errors == []
    assert len(rows) == 2
    assert rows[0]["bank"] == "gtbank"
    assert rows[0]["txn_date"] == "2026-01-01"
    assert rows[1]["status"] == "Possible duplicate"
    assert sum(row["amount_kobo"] for row in rows) == 300100
