"""Known-answer evaluation expectations independent of detector rules."""

import ml.eval.run as evaluation
import json
from pathlib import Path

import pytest

from ml import CategoryResult
from ml.eval.run import (
    category_metrics,
    evaluate,
    load_fixture,
    main,
    majority_category,
    pair_metrics,
    render_report,
)

FIXTURES = Path(__file__).parent / "fixtures"


def test_category_metrics_known_answers():
    # Four hand-scored rows distinguish accuracy, abstention and confident errors.
    labels = {"a": "Food", "b": "Food", "c": "Transport", "d": "Uncategorized"}
    results = [
        CategoryResult("a", "Food", 0.9),
        CategoryResult("b", "Transport", 0.9),
        CategoryResult("c", "Uncategorized", 0.0),
        CategoryResult("d", "Uncategorized", 0.0),
    ]
    metrics = category_metrics(labels, results)
    assert metrics["rows"] == 4
    assert metrics["correct"] == 2
    assert metrics["accuracy"] == 0.5
    assert metrics["abstentions"] == 2
    assert metrics["abstain_rate"] == 0.5
    assert metrics["confident_mistakes"] == 1
    assert metrics["confident_mistake_rate"] == 0.25
    assert metrics["per_category"]["Food"] == {
        "support": 2, "predicted": 1, "true_positive": 1,
        "precision": 1.0, "recall": 0.5,
    }
    assert metrics["per_category"]["Transport"]["precision"] == 0.0
    assert metrics["per_category"]["Health"]["precision"] is None
    assert metrics["per_category"]["Health"]["recall"] is None


def test_empty_metrics_and_baseline_tie():
    # No support is undefined, and ties use the documented category order.
    assert category_metrics({}, [])["accuracy"] is None
    assert majority_category({"a": "Transport", "b": "Food"}) == "Food"
    assert majority_category({"a": "Food", "b": "Transport", "c": "Transport"}) == "Transport"
    with pytest.raises(ValueError):
        majority_category({})


@pytest.mark.parametrize("ids", [["a"], ["a", "a"], ["a", "z"]])
def test_category_alignment_rejected(ids):
    results = [CategoryResult(txn_id, "Food", 0.9) for txn_id in ids]
    with pytest.raises(ValueError):
        category_metrics({"a": "Food", "b": "Food"}, results)


def test_pair_metrics_match_kind_and_unordered_identity():
    # One hit, one false positive and one miss give both rates one half.
    expected = [("duplicate", ("a", "b")), ("duplicate", ("c", "d"))]
    predicted = [("duplicate", ("b", "a")), ("duplicate", ("e", "f")),
                 ("internal_transfer", ("a", "b"))]
    metrics = pair_metrics(expected, predicted)
    assert metrics["duplicate"] == {
        "true_positive": 1, "false_positive": 1, "false_negative": 1,
        "expected": 2, "predicted": 2, "precision": 0.5, "recall": 0.5,
    }
    assert metrics["internal_transfer"]["precision"] == 0.0
    assert metrics["internal_transfer"]["recall"] is None
    assert pair_metrics([], [])["duplicate"]["precision"] is None
    with pytest.raises(ValueError):
        pair_metrics(expected, predicted + [predicted[0]])


def test_fixture_loader_keeps_labels_outside_inputs():
    transactions, labels, pairs = load_fixture(FIXTURES / "development.json", "development")
    assert len(transactions) == 57
    assert len(labels) == 57
    assert len(pairs) == 10
    assert not hasattr(transactions[0], "category")
    with pytest.raises(ValueError):
        load_fixture(FIXTURES / "challenge.json", "development")


def test_fixture_missing_label_rejected(tmp_path):
    # An incomplete answer table must fail instead of shrinking the denominator.
    document = json.loads((FIXTURES / "development.json").read_text(encoding="utf-8"))
    document["cases"][0]["expected"]["categories"].popitem()
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(document), encoding="utf-8")
    with pytest.raises(ValueError):
        load_fixture(path, "development")


def test_report_is_repeatable_separate_and_description_free():
    # The report exposes denominators and provenance without copying source rows.
    result = evaluate(FIXTURES)
    assert list(result["splits"]) == ["generated_development", "fixed_development", "challenge"]
    assert result["splits"]["generated_development"]["category"]["rows"] == 746
    assert result["splits"]["challenge"]["category"]["rows"] == 57
    assert result["baseline_category"] == "Uncategorized"
    assert result["splits"]["generated_development"]["baseline_correct"] == 82
    assert result["splits"]["fixed_development"]["baseline_correct"] == 18
    assert result["splits"]["challenge"]["baseline_correct"] == 18
    metadata = {"commit": "a" * 40, "dirty": True}
    report = render_report(result, metadata)
    assert report == render_report(evaluate(FIXTURES), metadata)
    assert "Synthetic accuracy does not establish real-world accuracy." in report
    assert "dirty" in report
    assert "N/A" in report
    assert "20261111" in report
    assert "2026-01-01" in report and "2026-06-30" in report
    assert "ml-0.1.0" in report
    assert "a" * 40 in report
    for split in ("development", "challenge"):
        document = json.loads((FIXTURES / f"{split}.json").read_text(encoding="utf-8"))
        for case in document["cases"]:
            for row in case["transactions"]:
                assert row["description"] not in report


def test_cli_writes_report_and_handles_bad_inputs(tmp_path, capsys):
    # CLI and library use the same evaluation; failures reveal no fixture payload.
    output = tmp_path / "nested" / "report.md"
    assert main(["--fixtures", str(FIXTURES), "--out", str(output)]) == 0
    assert output.read_text(encoding="utf-8").startswith("# SpendLens ML V1")
    assert main(["--fixtures", str(tmp_path / "absent"), "--out", str(output)]) == 2
    assert "evaluation failed" in capsys.readouterr().err


def test_challenge_cannot_fit_majority_baseline(monkeypatch):
    # Changing challenge answers in a scoring-only stub cannot alter the baseline.
    original_loader = evaluation.load_fixture
    original = evaluate(FIXTURES)

    def altered_loader(path, split):
        transactions, labels, pairs = original_loader(path, split)
        if split == "challenge":
            labels = {txn_id: "Health" for txn_id in labels}
        return transactions, labels, pairs

    monkeypatch.setattr(evaluation, "load_fixture", altered_loader)
    altered = evaluate(FIXTURES)
    assert altered["baseline_category"] == original["baseline_category"]
    assert altered["development_labels"] == original["development_labels"]
    assert altered["splits"]["generated_development"] == original["splits"]["generated_development"]
    assert altered["splits"]["challenge"]["category"] != original["splits"]["challenge"]["category"]


def test_modified_challenge_is_rejected(tmp_path):
    # Even harmless wording edits violate the independently frozen challenge.
    text = (FIXTURES / "challenge.json").read_text(encoding="utf-8")
    path = tmp_path / "challenge.json"
    path.write_text(text + "\n", encoding="utf-8")
    with pytest.raises(ValueError, match="frozen digest"):
        load_fixture(path, "challenge")

def test_wrong_answer_table_shape_rejected(tmp_path):
    # A list of IDs is not an answer mapping even when it covers the same rows.
    document = json.loads((FIXTURES / "development.json").read_text(encoding="utf-8"))
    answers = document["cases"][0]["expected"]["categories"]
    document["cases"][0]["expected"]["categories"] = list(answers)
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps(document), encoding="utf-8")
    with pytest.raises(ValueError, match="answers must be an object"):
        load_fixture(path, "development")


def test_report_case_counts_come_from_assets():
    # Reporting changes to development asset counts must not require text edits.
    result = evaluate(FIXTURES)
    result["fixture_case_counts"]["development"] = 24
    report = render_report(result, {"commit": None, "dirty": None})
    assert "Fixed development cases: 24; challenge cases: 23." in report
    assert "Source commit: unavailable" in report
    assert "**unknown**" in report

@pytest.mark.parametrize("remote", [
    "https://github.com/example/spendlens.git",
    "https://private-token@github.com/example/spendlens.git",
    "git@github.com:example/spendlens.git",
    "ssh://git@github.com/example/spendlens.git",
])
def test_commit_link_has_safe_repository_path(remote):
    # Source links must point to a commit and strip any configured credentials.
    commit = "a" * 40
    expected = f"https://github.com/example/spendlens/commit/{commit}"
    assert evaluation._commit_url(remote, commit) == expected
    assert evaluation._commit_url("https://other.invalid/example/spendlens", commit) is None
    assert evaluation._commit_url(remote, "invalid") is None


def test_report_renders_known_metric_counts_and_rates():
    # Hand-scored nonperfect results must survive rendering without altered rates.
    result = evaluate(FIXTURES)
    labels = {"a": "Food", "b": "Food", "c": "Transport", "d": "Uncategorized"}
    predictions = [
        CategoryResult("a", "Food", 0.9),
        CategoryResult("b", "Transport", 0.9),
        CategoryResult("c", "Uncategorized", 0.0),
        CategoryResult("d", "Uncategorized", 0.0),
    ]
    categories = category_metrics(labels, predictions)
    expected_pairs = [("duplicate", ("a", "b")), ("duplicate", ("c", "d"))]
    found_pairs = [("duplicate", ("a", "b")), ("duplicate", ("b", "c"))]
    pairs = pair_metrics(expected_pairs, found_pairs)
    result["splits"] = {
        "known_answers": {
            "category": categories,
            "baseline_correct": 2,
            "baseline_accuracy": 0.5,
            "pairs": pairs,
        },
    }
    report = render_report(result, {"commit": None, "dirty": False})
    assert "Rows: 4; correct: 2; accuracy: 0.500000." in report
    assert "Abstentions: 2; rate: 0.500000." in report
    assert "Confident mistakes: 1; rate: 0.250000." in report
    assert "Majority baseline correct: 2/4; accuracy: 0.500000." in report
    assert "| Food | 2 | 1 | 1 | 1.000000 | 0.500000 |" in report
    assert "| duplicate | 2 | 2 | 1 | 1 | 1 | 0.500000 | 0.500000 |" in report
    assert "| Health | 0 | 0 | 0 | N/A | N/A |" in report
    assert "**clean**" in report
