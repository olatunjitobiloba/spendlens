"""Deterministic scenarios and known-answer checks for the evaluation harness."""

import json
import re
from pathlib import Path
from random import Random

from ai.explain import template_explanation
from ai.schemas import CategoryRow, DateRange, ScenarioResult
from ai.validate import fmt_naira, validate

FIXTURES = Path(__file__).parent.parent / "fixtures"
CATEGORIES = [
    "Dining",
    "Education",
    "Fitness",
    "Groceries",
    "Health",
    "Household",
    "Leisure",
    "Transport",
]
PERCENTS = [0, 20, 25, 40, 50, 100]
SHAPES = [
    "empty_evidence",
    "five_categories",
    "full_cut",
    "long_names",
    "no_cuts",
    "odd_kobo",
    "one_category",
    "two_warnings",
]
NUMBER_WORDS = {
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
    "hundred",
    "thousand",
}
_NUMBER_WORD_RE = re.compile(
    rf"\b(?:{'|'.join(sorted(NUMBER_WORDS, key=len, reverse=True))})\b",
    re.IGNORECASE,
)
_DIGIT_RE = re.compile(r"\d")
_NUMBER_RE = re.compile(r"\b\d+\b")


def _category_names(shape: str) -> list[str]:
    if shape == "long_names":
        return [
            "Essential household provisions",
            "Local commuting and transit",
            "Routine personal wellness",
        ]
    if shape == "one_category":
        return [CATEGORIES[0]]
    if shape == "five_categories":
        return CATEGORIES[:5]
    return CATEGORIES[:3]


def _amounts(index: int, count: int, odd: bool = False) -> list[int]:
    random = Random(index)
    amounts = [random.randint(10_001, 90_000) * 100 for _ in range(count)]
    if odd:
        amounts = [amount + 1 for amount in amounts]
    return amounts


def make_case(i: int) -> ScenarioResult:
    """Build the deterministic generated scenario assigned to index ``i``."""
    if not 0 <= i < 15:
        raise ValueError("generated case index must be between 0 and 14")
    shape = SHAPES[i % len(SHAPES)]
    names = _category_names(shape)
    amounts = _amounts(i, len(names), shape == "odd_kobo")
    if shape == "no_cuts":
        percents = [0] * len(names)
    elif shape == "full_cut":
        percents = [100] + [0] * (len(names) - 1)
    elif shape == "one_category":
        percents = [40]
    else:
        percents = [PERCENTS[(i + position + 1) % (len(PERCENTS) - 1)]
                    for position in range(len(names))]
    categories = [
        CategoryRow(
            category=name,
            total_kobo=total,
            percent=percent,
            reduction_kobo=total * percent // 100,
        )
        for name, total, percent in zip(names, amounts, percents)
    ]
    baseline = sum(category.total_kobo for category in categories)
    reduction = sum(category.reduction_kobo for category in categories)
    warnings = []
    if shape == "two_warnings":
        warnings = [
            "No transactions for 12 days in this range",
            "Some merchants may be missing",
        ]
    return ScenarioResult(
        data_revision=f"generated_{i}",
        range=DateRange(start="2026-01-01", end="2026-03-31"),
        baseline_kobo=baseline,
        categories=categories,
        total_reduction_kobo=reduction,
        remaining_kobo=baseline - reduction,
        protected_categories=["Charity", "Rent"],
        coverage_warnings=warnings,
        evidence_txn_ids=[] if shape == "empty_evidence" else [f"generated-{i}"],
    )


def _load_fixture(path: Path) -> ScenarioResult:
    return ScenarioResult.model_validate(json.loads(path.read_text(encoding="utf-8")))


def cases() -> list[tuple[str, ScenarioResult]]:
    """Return fixture-backed cases followed by all deterministic generated cases."""
    fixed = [
        (path.stem, _load_fixture(path))
        for path in sorted(FIXTURES.glob("scenario_*.json"))
    ]
    generated = [
        (f"gen_{SHAPES[i % len(SHAPES)]}_{chr(97 + i)}", make_case(i))
        for i in range(15)
    ]
    return fixed + generated


def _warning_phrase(warning: str) -> str:
    number = _NUMBER_RE.search(warning)
    if number:
        following = re.search(r"\w+", warning[number.end():])
        return f"{number.group()} {following.group()}" if following else number.group()
    words = re.findall(r"\w+", warning)
    return " ".join(words[:2])


def check(
    text: str,
    scenario: ScenarioResult,
    numbers_used: list[int] | None = None,
) -> list[str]:
    """Return named known-answer failures for model output."""
    failures: list[str] = []
    if validate(text, scenario, numbers_used):
        failures.append("validation")
    cuts = [category for category in scenario.categories if category.reduction_kobo > 0]
    expected_savings = {fmt_naira(scenario.total_reduction_kobo)}
    if not cuts:
        expected_savings.add(fmt_naira(scenario.baseline_kobo))
    if not any(saving.lower() in text.lower() for saving in expected_savings):
        failures.append("total_saving")
    if fmt_naira(scenario.remaining_kobo).lower() not in text.lower() and not (
        not cuts and fmt_naira(scenario.baseline_kobo).lower() in text.lower()
    ):
        failures.append("remaining")
    if any(
        category.lower() not in text.lower()
        for category in scenario.protected_categories
    ):
        failures.append("protected_categories")
    if any(_warning_phrase(warning).lower() not in text.lower()
           for warning in scenario.coverage_warnings):
        failures.append("warnings")
    if re.search(r"\bsubscriptions?\b", text, re.IGNORECASE):
        failures.append("forbidden_subscription")
    if len(text.split()) > 90:
        failures.append("word_limit")
    if _NUMBER_WORD_RE.search(text):
        failures.append("spelled_number")
    if cuts and scenario.total_reduction_kobo not in (numbers_used or []):
        failures.append("numbers_used_reduction")
    return failures
