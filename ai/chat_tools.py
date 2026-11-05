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


def make_chat_context(scenario: dict) -> dict:
    """Adapts a backend ScenarioResult payload or dictionary into the chat tools context shape.

    Accepts both:
    1. Raw ScenarioResult shape (categories as list with total_kobo, protected_categories list)
    2. Normalized chat context shape (categories as dict, protected list, cuts list)
    """
    if not isinstance(scenario, dict):
        raise ValueError("Scenario payload must be a dictionary")

    # If already normalized:
    if isinstance(scenario.get("categories"), dict):
        return scenario

    categories_dict = {}
    cuts_list = []
    protected = scenario.get("protected_categories") or scenario.get("protected") or []

    for row in scenario.get("categories", []):
        if not isinstance(row, dict):
            continue
        cat_name = row.get("category", "")
        total = row.get("total_kobo", 0)
        categories_dict[cat_name] = total
        reduction = row.get("reduction_kobo", 0)
        percent = row.get("percent", 0)
        if reduction > 0 or percent > 0:
            cuts_list.append({
                "category": cat_name,
                "percent": percent,
                "reduction_kobo": reduction,
            })

    return {
        "baseline_kobo": scenario.get("baseline_kobo", 0),
        "total_reduction_kobo": scenario.get("total_reduction_kobo", 0),
        "remaining_kobo": scenario.get("remaining_kobo", 0),
        "categories": categories_dict,
        "protected": protected,
        "cuts": cuts_list,
    }


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
        normalized_ctx = make_chat_context(ctx) if isinstance(ctx.get("categories"), list) else ctx
        return TOOLS[name](normalized_ctx, args if isinstance(args, dict) else {})
    except Exception:
        return {"error": "tool_failed"}

