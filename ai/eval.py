"""Deterministic scenarios and known-answer checks for the evaluation harness."""

import argparse
import json
import logging
import os
import re
import statistics
import subprocess
import sys
import time
from pathlib import Path
from random import Random

from ai.explain import explain, template_explanation
from ai.llm import complete
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
_URL_RE = re.compile(r"https?://[^\s\"']+")


class _EvalLogRedactor(logging.Filter):
    """Keep provider details out of output produced by the evaluation CLI."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        message = _URL_RE.sub("[redacted-url]", message)
        api_key = os.environ.get("LLM_API_KEY")
        if api_key:
            message = message.replace(api_key, "[redacted-secret]")
        record.msg = message
        record.args = ()
        return True


def _fake_model(system: str, user: str) -> str:
    """Return a valid model-shaped response using the existing safe template."""
    facts = json.loads(user.split("\n", 1)[0])
    categories = [
        CategoryRow(
            category=item["category"],
            total_kobo=item["saves"]["kobo"],
            percent=item["percent"],
            reduction_kobo=item["saves"]["kobo"],
        )
        for item in facts["cuts"]
    ]
    scenario = ScenarioResult(
        data_revision="fake",
        range=DateRange(start="0000-00-00", end="0000-00-00"),
        baseline_kobo=facts["baseline"]["kobo"],
        categories=categories,
        total_reduction_kobo=facts["total_reduction"]["kobo"],
        remaining_kobo=facts["remaining"]["kobo"],
        protected_categories=facts["protected_categories"],
        coverage_warnings=facts["warnings"],
    )
    explanation = template_explanation(scenario)
    return json.dumps(
        {"text": explanation.text, "numbers_used": explanation.numbers_used},
        ensure_ascii=False,
    )


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


def _git_sha() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip() or "unknown"
    except (OSError, subprocess.SubprocessError):
        return "unknown"


def _p95(latencies: list[float]) -> float:
    if not latencies:
        return 0
    ordered = sorted(latencies)
    if len(ordered) >= 20:
        return ordered[-2]
    return ordered[min(len(ordered) - 1, int(len(ordered) * 0.95))]


def run(llm=complete, mode: str = "live") -> dict:
    """Run every scenario sequentially and aggregate its outcome rows."""
    rows = []
    report_errors: dict[str, int] = {}
    for name, scenario in cases():
        shape = (
            name.removeprefix("gen_").rsplit("_", 1)[0]
            if name.startswith("gen_")
            else "fixture"
        )
        calls = 0
        llm_errors: dict[str, int] = {}
        started = time.perf_counter()

        def counted(system, user):
            nonlocal calls
            calls += 1
            try:
                return llm(system, user)
            except Exception as error:
                error_type = type(error).__name__
                llm_errors[error_type] = llm_errors.get(error_type, 0) + 1
                report_errors[error_type] = report_errors.get(error_type, 0) + 1
                raise

        try:
            explanation = explain(scenario, llm=counted)
            fails = check(
                explanation.text, scenario, explanation.numbers_used
            )
            if explanation.source == "template":
                outcome = "fallback"
            elif fails:
                outcome = "check_fail"
            else:
                outcome = "pass"
            error_message = None
        except Exception as error:
            outcome = "error"
            error_message = f"{type(error).__name__}: {error}"
            fails = [error_message]

        elapsed = (time.perf_counter() - started) * 1000
        row = {
            "name": name,
            "shape": shape,
            "outcome": outcome,
            "source": explanation.source if outcome != "error" else None,
            "ms": round(elapsed, 3),
            "calls": calls,
            "fails": fails,
            "llm_errors": llm_errors,
            "passed": outcome == "pass",
            "text": (
                explanation.text
                if outcome != "error"
                else error_message
            ),
        }
        rows.append(row)

    denominator = len(rows)
    counts = {
        outcome: sum(row["outcome"] == outcome for row in rows)
        for outcome in ("pass", "check_fail", "fallback", "error")
    }
    latencies = [row["ms"] for row in rows]
    retry_rows = sum(row["calls"] > 1 for row in rows)
    return {
        "run_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mode": mode,
        "model": os.environ.get("LLM_MODEL", "unknown"),
        "git_sha": _git_sha(),
        "cases": denominator,
        "pass_rate": counts["pass"] / denominator if denominator else 0,
        "check_fail_rate": (
            counts["check_fail"] / denominator if denominator else 0
        ),
        "fallback_rate": counts["fallback"] / denominator if denominator else 0,
        "error_rate": counts["error"] / denominator if denominator else 0,
        "retry_rate": retry_rows / denominator if denominator else 0,
        "p50_ms": statistics.median(latencies) if latencies else 0,
        "p95_ms": _p95(latencies),
        "llm_errors": report_errors,
        "rows": rows,
    }


def _redact(value):
    if isinstance(value, dict):
        return {key: _redact(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_redact(item) for item in value]
    if isinstance(value, str):
        redacted = _URL_RE.sub("[redacted-url]", value)
        api_key = os.environ.get("LLM_API_KEY")
        if api_key:
            redacted = redacted.replace(api_key, "[redacted-secret]")
        return redacted
    return value


def _print_report(report: dict) -> None:
    for row in report["rows"]:
        latency = f"{row['ms']} ms"
        if report["mode"] == "fake":
            latency += " (not model latency)"
        print(
            f"{row['name']}: {row['outcome']} source={row['source']} "
            f"latency={latency} calls={row['calls']} fails={row['fails']}"
        )
    print(
        f"pass_rate={report['pass_rate']:.3f} "
        f"fallback_rate={report['fallback_rate']:.3f} "
        f"check_fail_rate={report['check_fail_rate']:.3f} "
        f"error_rate={report['error_rate']:.3f} "
        f"retry_rate={report['retry_rate']:.3f} "
        f"p50={report['p50_ms']:.3f} ms p95={report['p95_ms']:.3f} ms"
    )
    if (
        report["mode"] == "live"
        and report["rows"]
        and all(row["llm_errors"] for row in report["rows"])
    ):
        print(
            "Warning: every case encountered an LLM error; "
            "check LLM_API_KEY, LLM_MODEL, and provider configuration.",
            file=sys.stderr,
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the explanation evaluation.")
    parser.add_argument("--fake", action="store_true", help="use the deterministic fake model")
    parser.add_argument("--min-pass", type=float, default=0.9)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args(argv)

    if not args.fake:
        missing = [
            name for name in ("LLM_API_KEY", "LLM_MODEL")
            if not os.environ.get(name)
        ]
        if missing:
            print(
                f"Live evaluation requires: {', '.join(missing)}.",
                file=sys.stderr,
            )
            return 2

    logger = logging.getLogger("ai")
    redactor = _EvalLogRedactor()
    logger.addFilter(redactor)
    try:
        report = run(llm=_fake_model if args.fake else complete,
                     mode="fake" if args.fake else "live")
    finally:
        logger.removeFilter(redactor)
    report = _redact(report)
    output = args.out or Path(
        "docs/eval_fake.json" if args.fake else "docs/eval_latest.json"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                      encoding="utf-8")
    _print_report(report)

    if report["error_rate"] > 0:
        return 2
    if report["pass_rate"] < args.min_pass:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
