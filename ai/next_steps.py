from typing import Any


def naira(kobo: int) -> str:
    return f"₦{kobo / 100:,.2f}"


def _normalize_categories(categories: Any) -> list[dict]:
    if isinstance(categories, dict):
        return [{"name": k, "amount_kobo": v} for k, v in categories.items()]
    rows = []
    for c in categories or []:
        if isinstance(c, dict):
            name = c.get("name") or c.get("category", "")
            amount = c.get("amount_kobo") if "amount_kobo" in c else c.get("total_kobo", 0)
        else:
            name = getattr(c, "name", getattr(c, "category", ""))
            amount = getattr(c, "amount_kobo", getattr(c, "total_kobo", 0))
        rows.append({"name": str(name), "amount_kobo": int(amount)})
    return rows


def next_steps(ctx: dict, recurring: list[dict]) -> list[dict]:
    steps = []
    protected = set(ctx.get("protected") or ctx.get("protected_categories") or [])
    cats = _normalize_categories(ctx.get("categories"))
    open_cats = [c for c in cats if c["name"] not in protected]

    if open_cats:
        top = max(open_cats, key=lambda c: c["amount_kobo"])
        steps.append(
            {
                "kind": "top_category",
                "text": (
                    f"Your largest unprotected category is {top['name']} "
                    f"at {naira(top['amount_kobo'])}. Try a smaller cut there."
                ),
            }
        )

    if recurring:
        total = sum(r.get("amount_kobo", 0) for r in recurring)
        steps.append(
            {
                "kind": "repeat_payments",
                "text": (
                    f"{len(recurring)} payments look like they repeat, "
                    f"about {naira(total)} per cycle. Confirm which are right."
                ),
            }
        )

    if ctx.get("remaining_kobo", 0) < 0:
        steps.append(
            {
                "kind": "over_baseline",
                "text": "Your planned cuts exceed your baseline. Lower a cut.",
            }
        )

    return steps
