"""Pinned text boundaries shared by categorization and future reconciliation."""

import pytest

from ml.normalize import normalize_description


@pytest.mark.parametrize(
    ("description", "expected"),
    [
        ("POS RIVER CANTEEN RICE 123!!!", "pos river canteen rice"),
        ("  Bus\tFARE\n", "bus fare"),
        ("food/transport", "food transport"),
        ("air-time", "air time"),
        ("air123time", "air time"),
        ("salary_payment", "salary payment"),
        ("123 !!!", ""),
        ("", ""),
        ("airtimekeeper", "airtimekeeper"),
    ],
)
def test_normalization_boundaries(description, expected):
    assert normalize_description(description) == expected
    assert normalize_description(expected) == expected
