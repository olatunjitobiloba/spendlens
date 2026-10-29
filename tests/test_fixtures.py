import json
from pathlib import Path

FIXTURES = Path(__file__).parent.parent / "fixtures"


def load(name):
    return json.loads((FIXTURES / name).read_text())


def test_scenario_01_math():
    s = load("scenario_01.json")
    for c in s["categories"]:
        assert c["reduction_kobo"] == c["total_kobo"] * c["percent"] // 100
    assert s["total_reduction_kobo"] == sum(c["reduction_kobo"] for c in s["categories"])
    assert s["baseline_kobo"] == sum(c["total_kobo"] for c in s["categories"])
    assert not set(s["protected_categories"]) & {c["category"] for c in s["categories"]}
