import time

MAX_CALLS = 4
MAX_SECONDS = 20


class Budget:
    """Stops a chat turn after 4 tool calls or 20 seconds."""

    def __init__(self):
        self.calls = 0
        self.start = time.monotonic()

    def spend(self) -> bool:
        if self.calls >= MAX_CALLS or time.monotonic() - self.start > MAX_SECONDS:
            return False
        self.calls += 1
        return True


# ctx shape, built by the backend:
# {
#     "baseline_kobo": int,
#     "total_reduction_kobo": int,
#     "remaining_kobo": int,
#     "categories": {"Food": 4500000, "Rent": 5500000},
#     "protected": ["Rent"],
#     "cuts": [{"category": "Food", "percent": 10, "reduction_kobo": 450000}],
# }


def get_summary(ctx: dict, args: dict) -> dict:
    return {
        k: ctx[k]
        for k in ("baseline_kobo", "total_reduction_kobo", "remaining_kobo")
    }


def list_categories(ctx: dict, args: dict) -> dict:
    rows = sorted(
        ctx["categories"].items(),
        key=lambda kv: (-kv[1], kv[0]),
    )
    return {
        "categories": [
            {
                "name": n,
                "spend_kobo": v,
                "protected": n in ctx["protected"],
            }
            for n, v in rows
        ]
    }


def get_category(ctx: dict, args: dict) -> dict:
    name = args.get("name") if isinstance(args, dict) else None
    if not name or name not in ctx["categories"]:
        return {"error": "unknown_category"}
    cut = next(
        (c for c in ctx.get("cuts", []) if isinstance(c, dict) and c.get("category") == name),
        None,
    )
    return {
        "name": name,
        "spend_kobo": ctx["categories"][name],
        "protected": name in ctx.get("protected", []),
        "cut": cut,
    }


TOOLS = {
    "get_summary": get_summary,
    "list_categories": list_categories,
    "get_category": get_category,
}


def run_tool(ctx: dict, budget: Budget, name: str, args: dict) -> dict:
    if name not in TOOLS:
        return {"error": "unknown_tool"}
    if not budget.spend():
        return {"error": "budget_exceeded"}
    try:
        return TOOLS[name](ctx, args if isinstance(args, dict) else {})
    except Exception:
        return {"error": "tool_failed"}
