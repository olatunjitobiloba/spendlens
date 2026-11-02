import re
import json
import logging
from pathlib import Path

from ai.eval import cases, check, main, make_case, run
from ai.explain import template_explanation
from ai.validate import validate


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


def test_at_least_20_cases():
    assert len(cases()) >= 20


def test_generated_cases_are_deterministic():
    assert [scenario for _, scenario in cases()] == [
        scenario for _, scenario in cases()
    ]


def test_generated_cases_cover_required_shapes():
    tags = {
        name.removeprefix("gen_").rsplit("_", 1)[0]
        for name, _ in cases()
        if name.startswith("gen_")
    }
    assert {
        "no_cuts",
        "one_category",
        "five_categories",
        "full_cut",
        "odd_kobo",
        "two_warnings",
        "empty_evidence",
        "long_names",
    } <= tags


def test_generated_case_invariants():
    for i in range(15):
        scenario = make_case(i)
        assert all(
            category.reduction_kobo
            == category.total_kobo * category.percent // 100
            for category in scenario.categories
        )
        assert scenario.baseline_kobo == sum(
            category.total_kobo for category in scenario.categories
        )
        assert scenario.total_reduction_kobo == sum(
            category.reduction_kobo for category in scenario.categories
        )
        assert scenario.remaining_kobo == (
            scenario.baseline_kobo - scenario.total_reduction_kobo
        )
        assert not (
            set(scenario.protected_categories)
            & {category.category for category in scenario.categories}
        )


def test_generated_names_and_templates_are_safe():
    for name, scenario in cases():
        if not name.startswith("gen_"):
            continue
        category_names = [category.category for category in scenario.categories]
        assert all(not re.search(r"\d", category) for category in category_names)
        assert all(
            not re.search(
                rf"\b(?:{'|'.join(NUMBER_WORDS)})\b",
                category,
                re.IGNORECASE,
            )
            for category in category_names
        )
        text = template_explanation(scenario)
        assert validate(text.text, scenario, text.numbers_used) == []
        assert len(text.text.split()) <= 90


def test_check_accepts_template_explanations():
    for _, scenario in cases():
        explanation = template_explanation(scenario)
        assert check(
            explanation.text, scenario, explanation.numbers_used
        ) == []


def test_check_reports_known_answer_failures():
    scenario = make_case(0)
    failures = check("This answer is unrelated.", scenario, [])
    assert "total_saving" in failures
    assert "remaining" in failures
    assert "protected_categories" in failures


def test_check_rejects_subscription_spellings_and_number_words():
    scenario = make_case(0)
    failures = check(
        "No cuts. Subscription and subscriptions are mentioned. one.",
        scenario,
        [],
    )
    assert "forbidden_subscription" in failures
    assert "spelled_number" in failures


def test_run_counts_retries_for_fallback_rows():
    def wrong_json(system, user):
        return '{"text": "not valid json for this scenario"}'

    report = run(llm=wrong_json, mode="fake")

    assert report["fallback_rate"] == 1
    assert report["pass_rate"] == 0
    assert report["check_fail_rate"] == 0
    assert report["retry_rate"] == 1
    assert all(row["outcome"] == "fallback" for row in report["rows"])


def test_run_classifies_valid_but_incomplete_explanations_as_check_fail():
    def incomplete(system, user):
        return '{"text": "An explanation without the required facts.", "numbers_used": []}'

    report = run(llm=incomplete, mode="fake")

    assert report["check_fail_rate"] == 1
    assert report["fallback_rate"] == 0
    assert all(row["outcome"] == "check_fail" for row in report["rows"])


def test_run_records_retries():
    attempts = {}

    def retry_once(system, user):
        case_key = user.split("\n", 1)[0]
        attempts[case_key] = attempts.get(case_key, 0) + 1
        if attempts[case_key] == 1:
            return '{"text": '
        facts = json.loads(user.split("\n", 1)[0])
        return (
            '{"text": "'
            + facts["baseline"]["display"]
            + '", "numbers_used": []}'
        )

    report = run(llm=retry_once, mode="fake")

    assert report["retry_rate"] > 0
    assert any(row["calls"] == 2 for row in report["rows"])


def test_fake_cli_writes_passing_report(tmp_path):
    output = tmp_path / "fake.json"

    assert main(["--fake", "--out", str(output)]) == 0

    report = json.loads(output.read_text(encoding="utf-8"))
    assert report["mode"] == "fake"
    assert report["pass_rate"] == 1
    assert report["fallback_rate"] == 0
    assert report["retry_rate"] == 0
    assert all(row["outcome"] == "pass" for row in report["rows"])


def test_live_cli_requires_configuration(monkeypatch, tmp_path, capsys):
    for name in (
        "LLM_API_KEY",
        "LLM_MODEL",
        "GROQ_API_KEY",
        "GROQ_MODEL",
        "GEMINI_API_KEY",
        "GEMINI_MODEL",
    ):
        monkeypatch.delenv(name, raising=False)

    assert main(["--out", str(tmp_path / "live.json")]) == 2
    assert "LLM_API_KEY" in capsys.readouterr().err


def test_live_cli_accepts_groq_configuration(monkeypatch, tmp_path):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.setenv("GROQ_API_KEY", "groq-secret")
    monkeypatch.delenv("GROQ_MODEL", raising=False)
    monkeypatch.setattr("ai.eval.run", lambda llm, mode: {
        "mode": mode,
        "pass_rate": 1,
        "fallback_rate": 0,
        "check_fail_rate": 0,
        "error_rate": 0,
        "retry_rate": 0,
        "p50_ms": 0,
        "p95_ms": 0,
        "rows": [],
    })

    assert main(["--out", str(tmp_path / "live.json")]) == 0


def test_live_cli_accepts_gemini_configuration(monkeypatch, tmp_path):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-secret")
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    monkeypatch.setattr("ai.eval.run", lambda llm, mode: {
        "mode": mode,
        "pass_rate": 1,
        "fallback_rate": 0,
        "check_fail_rate": 0,
        "error_rate": 0,
        "retry_rate": 0,
        "p50_ms": 0,
        "p95_ms": 0,
        "rows": [],
    })

    assert main(["--out", str(tmp_path / "live.json")]) == 0


def test_live_cli_accepts_generic_key_without_model(monkeypatch, tmp_path):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.setenv("LLM_API_KEY", "generic-secret")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    monkeypatch.setattr("ai.eval.run", lambda llm, mode: {
        "mode": mode,
        "pass_rate": 1,
        "fallback_rate": 0,
        "check_fail_rate": 0,
        "error_rate": 0,
        "retry_rate": 0,
        "p50_ms": 0,
        "p95_ms": 0,
        "rows": [],
    })

    assert main(["--out", str(tmp_path / "live.json")]) == 0


def test_fake_cli_defaults_to_fake_report_path(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)

    assert main(["--fake"]) == 0
    assert (tmp_path / "docs" / "eval_fake.json").exists()
    assert not (tmp_path / "docs" / "eval_latest.json").exists()


def test_min_pass_failure_returns_one(monkeypatch, tmp_path):
    monkeypatch.setattr("ai.eval._fake_model", lambda system, user: '{"text": "bad"}')

    assert main(["--fake", "--min-pass", "1.1", "--out", str(tmp_path / "report.json")]) == 1


def test_error_outcome_returns_two(monkeypatch, tmp_path):
    monkeypatch.setattr(
        "ai.eval.run",
        lambda llm, mode: {
            "mode": mode,
            "pass_rate": 0,
            "fallback_rate": 0,
            "check_fail_rate": 0,
            "error_rate": 1,
            "retry_rate": 0,
            "p50_ms": 0,
            "p95_ms": 0,
            "rows": [{
                "name": "case",
                "outcome": "error",
                "source": None,
                "ms": 0,
                "calls": 1,
                "fails": ["provider"],
                "llm_errors": {},
            }],
            "llm_errors": {},
        },
    )

    assert main(["--fake", "--out", str(tmp_path / "report.json")]) == 2


def test_report_has_complete_fields_and_redacts_secrets(monkeypatch, tmp_path):
    monkeypatch.setenv("LLM_API_KEY", "secret-key")
    monkeypatch.setenv("GROQ_API_KEY", "groq-secret")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-secret")
    report_path = tmp_path / "report.json"
    monkeypatch.setattr(
        "ai.eval.run",
        lambda llm, mode: {
            "mode": mode,
            "model": "model",
            "run_at": "now",
            "git_sha": "sha",
            "cases": 1,
            "pass_rate": 1,
            "fallback_rate": 0,
            "check_fail_rate": 0,
            "error_rate": 0,
            "retry_rate": 0,
            "p50_ms": 1,
            "p95_ms": 1,
            "llm_errors": {},
            "rows": [{
                "name": "case",
                "outcome": "pass",
                "source": "model",
                "ms": 1,
                "calls": 1,
                "fails": [],
                "llm_errors": {},
                "text": (
                    "secret-key groq-secret gemini-secret "
                    "https://provider.example/v1"
                ),
            }],
        },
    )

    assert main(["--fake", "--out", str(report_path)]) == 0
    content = report_path.read_text(encoding="utf-8")
    assert "secret-key" not in content
    assert "groq-secret" not in content
    assert "gemini-secret" not in content
    assert "https://provider.example" not in content
    report = json.loads(content)
    assert {"mode", "cases", "pass_rate", "rows"} <= report.keys()
    assert {"name", "outcome", "source", "ms", "calls", "fails"} <= report["rows"][0].keys()


def test_report_write_error_returns_status_two(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr("ai.eval.run", lambda llm, mode: {
        "mode": mode,
        "pass_rate": 1,
        "fallback_rate": 0,
        "check_fail_rate": 0,
        "error_rate": 0,
        "retry_rate": 0,
        "p50_ms": 0,
        "p95_ms": 0,
        "rows": [],
    })

    def fail_write(self, data, encoding=None):
        raise OSError("disk full")

    monkeypatch.setattr(Path, "write_text", fail_write)
    assert main(["--fake", "--out", str(tmp_path / "report.json")]) == 2
    diagnostic = capsys.readouterr().err
    assert "could not write report" in diagnostic.lower()
    assert "disk full" in diagnostic


def test_all_live_llm_errors_print_configuration_warning(
    monkeypatch, tmp_path, capsys
):
    monkeypatch.setenv("LLM_API_KEY", "secret-key")
    monkeypatch.setenv("LLM_MODEL", "model")
    monkeypatch.setenv("GROQ_API_KEY", "groq-secret")
    monkeypatch.setenv("GROQ_MODEL", "groq-model")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-secret")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-model")

    def failing(system, user):
        logging.getLogger("ai").warning(
            "provider keys secret-key groq-secret gemini-secret failed at "
            "https://provider.example/v1"
        )
        raise RuntimeError(
            "request failed with secret-key groq-secret gemini-secret at "
            "https://provider.example/v1"
        )

    monkeypatch.setattr("ai.eval.complete", failing)
    assert main(["--out", str(tmp_path / "report.json")]) == 1
    captured = capsys.readouterr()
    assert "configuration" in captured.err.lower()
    assert "provider.example" not in captured.err
    assert "secret-key" not in captured.err
    assert "groq-secret" not in captured.err
    assert "gemini-secret" not in captured.err
