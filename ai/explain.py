import json
import logging
import sys

from ai.llm import complete
from ai.schemas import Explanation, ScenarioResult
from ai.validate import fmt_naira, validate

log = logging.getLogger("ai")

SYSTEM = """You explain a savings scenario to a user in plain language.
Reply with JSON only: {"text": string, "numbers_used": [integers]}.
Rules:
- Use ONLY the figures in the facts. Never calculate, round or estimate.
- Copy each amount exactly as written in its "display" field, for example ₦12,000.
- Write numbers as digits. No abbreviations like 12k, and no spelled-out numbers.
- numbers_used lists the kobo integers for every amount you mention.
- Name the protected categories as ones that stay untouched.
- If there are warnings, mention them in plain words.
- Do not advise on specific purchases. Do not say "subscription".
- At most 90 words."""


def build_facts(s: ScenarioResult) -> dict:
    def money(kobo):
        return {"kobo": kobo, "display": fmt_naira(kobo)}

    return {
        "period": f"{s.range.start} to {s.range.end}",
        "baseline": money(s.baseline_kobo),
        "total_reduction": money(s.total_reduction_kobo),
        "remaining": money(s.remaining_kobo),
        "cuts": [
            {
                "category": c.category,
                "percent": c.percent,
                "saves": money(c.reduction_kobo),
            }
            for c in s.categories
            if c.reduction_kobo > 0
        ],
        "protected_categories": s.protected_categories,
        "warnings": s.coverage_warnings,
    }


def template_explanation(s: ScenarioResult) -> Explanation:
    """Safe fallback. Built only from scenario values, so it always validates."""
    cuts = [c for c in s.categories if c.reduction_kobo > 0]
    if cuts:
        parts = [
            f"{c.category} {c.percent}% (saves {fmt_naira(c.reduction_kobo)})"
            for c in cuts
        ]
        text = (
            f"Cuts: {', '.join(parts)}. Total saving: {fmt_naira(s.total_reduction_kobo)}. "
            f"Remaining: {fmt_naira(s.remaining_kobo)}."
        )
        used = [c.reduction_kobo for c in cuts] + [
            s.total_reduction_kobo,
            s.remaining_kobo,
        ]
    else:
        text = f"No cuts are selected, so spending stays at {fmt_naira(s.baseline_kobo)}."
        used = [s.baseline_kobo]
    if s.protected_categories:
        text += f" Protected: {', '.join(s.protected_categories)}."
    if s.coverage_warnings:
        text += f" Note: {'; '.join(s.coverage_warnings)}."
    return Explanation(text=text, numbers_used=used, source="template")


def explain(s: ScenarioResult, llm=complete, retries: int = 1) -> Explanation:
    """Validated model explanation, or the template if the model cannot produce one."""
    problems: list[str] = []
    for _ in range(retries + 1):
        user = json.dumps(build_facts(s), ensure_ascii=False)
        if problems:
            user += "\nYour last answer was rejected: " + "; ".join(problems[:3])
        try:
            data = json.loads(llm(SYSTEM, user))
            exp = Explanation(text=data["text"], numbers_used=data["numbers_used"])
        except Exception as e:  # timeout, HTTP error, bad JSON, wrong shape: all mean "fall back"
            problems = [f"unusable output ({type(e).__name__})"]
            continue
        problems = validate(exp.text, s, exp.numbers_used)
        if not problems:
            return exp
    log.warning("explain fell back to template: %s", problems)
    return template_explanation(s)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    scenario = ScenarioResult.model_validate(
        json.load(open(sys.argv[1], encoding="utf-8"))
    )
    result = explain(scenario)
    print(result.source, "|", result.text)
