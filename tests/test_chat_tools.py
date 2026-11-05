import copy
import time
from ai.chat_tools import MAX_CALLS, MAX_SECONDS, Budget, run_tool

CTX = {
    "baseline_kobo": 10000000,
    "total_reduction_kobo": 450000,
    "remaining_kobo": 9550000,
    "categories": {"Food": 4500000, "Rent": 5500000},
    "protected": ["Rent"],
    "cuts": [{"category": "Food", "percent": 10, "reduction_kobo": 450000}],
}


def test_summary_returns_backend_numbers():
    out = run_tool(CTX, Budget(), "get_summary", {})
    assert out["remaining_kobo"] == 9550000
    assert out["baseline_kobo"] == 10000000
    assert out["total_reduction_kobo"] == 450000


def test_categories_sorted_and_flagged():
    out = run_tool(CTX, Budget(), "list_categories", {})
    assert [c["name"] for c in out["categories"]] == ["Rent", "Food"]
    assert out["categories"][0]["protected"] is True
    assert out["categories"][1]["protected"] is False


def test_get_category_with_and_without_cut():
    food = run_tool(CTX, Budget(), "get_category", {"name": "Food"})
    assert food["name"] == "Food"
    assert food["spend_kobo"] == 4500000
    assert food["protected"] is False
    assert food["cut"] == {"category": "Food", "percent": 10, "reduction_kobo": 450000}

    rent = run_tool(CTX, Budget(), "get_category", {"name": "Rent"})
    assert rent["name"] == "Rent"
    assert rent["spend_kobo"] == 5500000
    assert rent["protected"] is True
    assert rent["cut"] is None


def test_unknown_tool_and_category():
    assert run_tool(CTX, Budget(), "delete_everything", {})["error"] == "unknown_tool"
    assert run_tool(CTX, Budget(), "get_category", {"name": "Nope"})["error"] == "unknown_category"


def test_budget_stops_fifth_call():
    b = Budget()
    for _ in range(4):
        assert "error" not in run_tool(CTX, b, "get_summary", {})
    assert run_tool(CTX, b, "get_summary", {})["error"] == "budget_exceeded"


def test_budget_stops_after_timeout(monkeypatch):
    b = Budget()
    # Fast forward time beyond MAX_SECONDS
    real_monotonic = time.monotonic
    monkeypatch.setattr(time, "monotonic", lambda: real_monotonic() + MAX_SECONDS + 1)
    assert run_tool(CTX, b, "get_summary", {})["error"] == "budget_exceeded"


def test_bad_args_do_not_raise():
    assert "error" in run_tool(CTX, Budget(), "get_category", "junk")
    assert "error" in run_tool(CTX, Budget(), "get_category", None)


def test_tool_failure_on_corrupt_ctx():
    assert run_tool({}, Budget(), "get_summary", {})["error"] == "tool_failed"
    assert run_tool({}, Budget(), "list_categories", {})["error"] == "tool_failed"


def test_tools_do_not_mutate_ctx():
    ctx_copy = copy.deepcopy(CTX)
    b = Budget()
    run_tool(ctx_copy, b, "get_summary", {})
    run_tool(ctx_copy, b, "list_categories", {})
    run_tool(ctx_copy, b, "get_category", {"name": "Food"})
    assert ctx_copy == CTX
