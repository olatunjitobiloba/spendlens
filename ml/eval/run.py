"""Fixed synthetic V1 evaluation, with explicit denominators and provenance."""

import argparse
from collections import Counter
from datetime import date, time
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
import sys
from typing import Iterable

from ml import CATEGORIES, MODEL_VERSION, CategoryResult, Txn, __version__
from ml import categorize, find_reconciliation_candidates
from ml.synthetic import generate_dataset
from ml.types import validate_transactions

KINDS = ("duplicate", "internal_transfer")
CHALLENGE_SHA256 = "9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd"
Pair = tuple[str, tuple[str, str]]
CAVEAT = "Synthetic accuracy does not establish real-world accuracy."


def _ratio(numerator: int, denominator: int) -> float | None:
    return numerator / denominator if denominator else None


def majority_category(labels: dict[str, str]) -> str:
    """Choose the development majority; vocabulary order breaks ties."""
    if not labels or any(value not in CATEGORIES for value in labels.values()):
        raise ValueError("development category labels must be complete and valid")
    counts = Counter(labels.values())
    return max(CATEGORIES, key=lambda category: counts[category])


def category_metrics(
    labels: dict[str, str],
    results: list[CategoryResult],
) -> dict:
    """Score every labeled row, including correct Uncategorized predictions."""
    # Alignment failures must not silently reduce the evaluation denominator.
    result_ids = [result.txn_id for result in results]
    if len(set(result_ids)) != len(result_ids) or set(result_ids) != set(labels):
        raise ValueError("category result IDs must match labels exactly")
    if any(value not in CATEGORIES for value in labels.values()):
        raise ValueError("category labels must use the documented vocabulary")

    correct = 0
    abstentions = 0
    confident_mistakes = 0
    per_category = {}
    for result in results:
        matches = result.category == labels[result.txn_id]
        correct += int(matches)
        abstentions += int(result.category == "Uncategorized")
        confident_mistakes += int(result.confidence > 0.0 and not matches)

    # Undefined class metrics remain N/A rather than implying perfect performance.
    for category in CATEGORIES:
        support = sum(value == category for value in labels.values())
        predicted = sum(result.category == category for result in results)
        hits = sum(
            result.category == category and labels[result.txn_id] == category
            for result in results
        )
        per_category[category] = {
            "support": support,
            "predicted": predicted,
            "true_positive": hits,
            "precision": _ratio(hits, predicted),
            "recall": _ratio(hits, support),
        }

    rows = len(labels)
    return {
        "rows": rows,
        "correct": correct,
        "accuracy": _ratio(correct, rows),
        "abstentions": abstentions,
        "abstain_rate": _ratio(abstentions, rows),
        "confident_mistakes": confident_mistakes,
        "confident_mistake_rate": _ratio(confident_mistakes, rows),
        "per_category": per_category,
    }


def _pair_set(pairs: Iterable[Pair]) -> set[Pair]:
    # Canonicalize unordered pairs but reject duplicate or malformed evidence.
    result = set()
    for kind, ids in pairs:
        if kind not in KINDS or len(ids) != 2 or ids[0] == ids[1]:
            raise ValueError("candidate pair must have a valid kind and distinct IDs")
        pair = (kind, tuple(sorted(ids)))
        if pair in result:
            raise ValueError("candidate pairs must be unique")
        result.add(pair)
    return result


def pair_metrics(expected: Iterable[Pair], predicted: Iterable[Pair]) -> dict:
    """Score candidate eligibility by kind and pair, never deletion decisions."""
    expected_set = _pair_set(expected)
    predicted_set = _pair_set(predicted)
    metrics = {}
    for kind in KINDS:
        truth = {pair for pair in expected_set if pair[0] == kind}
        found = {pair for pair in predicted_set if pair[0] == kind}
        hits = len(truth & found)
        metrics[kind] = {
            "true_positive": hits,
            "false_positive": len(found - truth),
            "false_negative": len(truth - found),
            "expected": len(truth),
            "predicted": len(found),
            "precision": _ratio(hits, len(found)),
            "recall": _ratio(hits, len(truth)),
        }
    return metrics


def load_fixture(path: Path, split: str) -> tuple[list[Txn], dict[str, str], list[Pair]]:
    """Read synthetic evaluation assets without passing answers to detectors."""
    text = path.read_text(encoding="utf-8")
    document = json.loads(text)
    if document["schema_version"] != 1 or document["split"] != split:
        raise ValueError("fixture schema or split mismatch")
    if split == "challenge":
        normalized_bytes = text.replace("\r\n", "\n").encode("utf-8")
        if sha256(normalized_bytes).hexdigest() != CHALLENGE_SHA256:
            raise ValueError("challenge fixture differs from its frozen digest")

    transactions = []
    labels = {}
    pairs = []
    for case in document["cases"]:
        case_ids = set()
        for row in case["transactions"]:
            values = dict(row)
            values["date"] = date.fromisoformat(values["date"])
            if values["time"] is not None:
                values["time"] = time.fromisoformat(values["time"])
            txn = Txn(**values)
            transactions.append(txn)
            case_ids.add(txn.id)
        answers = case["expected"]["categories"]
        if not isinstance(answers, dict):
            raise ValueError("fixture category answers must be an object")
        if set(answers) != case_ids:
            raise ValueError("fixture category labels must cover each case exactly")
        for txn_id, answer in answers.items():
            labels[txn_id] = answer["category"]
        for answer in case["expected"]["candidates"]:
            ids = tuple(answer["txn_ids"])
            if not set(ids) <= case_ids:
                raise ValueError("fixture pair IDs must belong to their case")
            pairs.append((answer["kind"], ids))

    validate_transactions(transactions)
    _pair_set(pairs)
    if not transactions or any(value not in CATEGORIES for value in labels.values()):
        raise ValueError("fixture must contain valid labeled transactions")
    return transactions, labels, pairs


def _score(
    transactions: list[Txn],
    labels: dict[str, str],
    expected_pairs: list[Pair],
    baseline: str,
) -> dict:
    # Only canonical inputs enter production functions; answers stay in scoring.
    results = categorize(transactions)
    candidates = find_reconciliation_candidates(transactions)
    ids = {txn.id for txn in transactions}
    if any(not set(candidate.txn_ids) <= ids for candidate in candidates):
        raise ValueError("predicted candidate IDs must belong to the input")
    predicted_pairs = [(candidate.kind, candidate.txn_ids) for candidate in candidates]
    baseline_hits = sum(value == baseline for value in labels.values())
    return {
        "category": category_metrics(labels, results),
        "baseline_correct": baseline_hits,
        "baseline_accuracy": _ratio(baseline_hits, len(labels)),
        "pairs": pair_metrics(expected_pairs, predicted_pairs),
    }


def evaluate(fixtures: Path) -> dict:
    """Run one fixed seed and two independent fixture splits deterministically."""
    generated = generate_dataset()
    development, dev_labels, dev_pairs = load_fixture(
        fixtures / "development.json",
        "development",
    )
    challenge, challenge_labels, challenge_pairs = load_fixture(
        fixtures / "challenge.json",
        "challenge",
    )
    generated_labels = dict(generated.category_labels)

    # Fit the trivial baseline on development labels only, never on challenge.
    development_labels = dict(generated_labels)
    if set(development_labels) & set(dev_labels):
        raise ValueError("development split IDs must not overlap")
    development_labels.update(dev_labels)
    if set(development_labels) & set(challenge_labels):
        raise ValueError("challenge and development IDs must not overlap")
    baseline = majority_category(development_labels)
    generated_pairs = [(pair.kind, pair.txn_ids) for pair in generated.candidate_labels]
    splits = {
        "generated_development": _score(
            list(generated.transactions),
            generated_labels,
            generated_pairs,
            baseline,
        ),
        "fixed_development": _score(
            development,
            dev_labels,
            dev_pairs,
            baseline,
        ),
        "challenge": _score(
            challenge,
            challenge_labels,
            challenge_pairs,
            baseline,
        ),
    }
    # Record the exact newline-normalized assets used for these measurements.
    fixture_hashes = {}
    fixture_case_counts = {}
    for name in ("development", "challenge"):
        fixture_text = (fixtures / f"{name}.json").read_text(encoding="utf-8")
        fixture_bytes = fixture_text.encode("utf-8")
        fixture_hashes[name] = sha256(fixture_bytes).hexdigest()
        fixture_document = json.loads(fixture_text)
        fixture_case_counts[name] = len(fixture_document["cases"])

    return {
        "manifest": generated.manifest(),
        "baseline_category": baseline,
        "development_labels": development_labels,
        "splits": splits,
        "fixture_hashes": fixture_hashes,
        "fixture_case_counts": fixture_case_counts,
    }



def _commit_url(remote: str, commit: str) -> str | None:
    # Rebuild supported GitHub links from safe path components, never credentials.
    remote_path = remote.strip().removesuffix(".git")
    match = re.fullmatch(
        r"(?:https://(?:[^/@]+@)?github\.com/|git@github\.com:|ssh://git@github\.com/)"
        r"([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)",
        remote_path,
    )
    if match is None or re.fullmatch(r"[0-9a-f]{40,64}", commit) is None:
        return None
    repository = match.group(1)
    return f"https://github.com/{repository}/commit/{commit}"


def source_metadata(root: Path) -> dict:
    """Read local Git provenance without accessing remotes or credentials."""
    # A command-local trust setting permits read-only inspection in the sandbox.
    prefix = ["git", "-c", f"safe.directory={root.resolve().as_posix()}", "-C", str(root)]
    try:
        commit_process = subprocess.run(
            prefix + ["rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        )
        commit = commit_process.stdout.strip()
        status_process = subprocess.run(
            prefix + ["status", "--porcelain", "--untracked-files=all"],
            check=True,
            capture_output=True,
            text=True,
        )
        status = status_process.stdout
    except (OSError, subprocess.CalledProcessError):
        return {"commit": None, "dirty": None}
    # Read the configured origin locally; this never contacts the remote host.
    try:
        origin_process = subprocess.run(
            prefix + ["config", "--get", "remote.origin.url"],
            check=True,
            capture_output=True,
            text=True,
        )
        commit_url = _commit_url(origin_process.stdout, commit)
    except (OSError, subprocess.CalledProcessError):
        commit_url = None
    return {"commit": commit, "dirty": bool(status), "commit_url": commit_url}


def _display(value: float | None) -> str:
    return "N/A" if value is None else f"{value:.6f}"


def render_report(result: dict, metadata: dict) -> str:
    """Render aggregate evidence without transaction descriptions or raw rows."""
    commit = metadata["commit"]
    state = {True: "dirty", False: "clean", None: "unknown"}[metadata["dirty"]]
    commit_text = f"`{commit}`" if commit else "unavailable"
    commit_url = metadata.get("commit_url")
    if commit and commit_url:
        commit_text = f"[{commit}]({commit_url})"
    manifest = result["manifest"]
    lines = [
        "# SpendLens ML V1 synthetic evaluation",
        "",
        CAVEAT,
        "",
        f"Package: spendlens-ml {__version__}; model: {MODEL_VERSION}; method: rule.",
        f"Source commit: {commit_text}; worktree at invocation: **{state}**.",
        "A dirty worktree includes uncommitted source; the commit alone does not reproduce it.",
        "Reproduction: `python -m ml.eval.run --out reports/eval_v1.md` from the repository root.",
        f"Generated development seed: {manifest['seed']}; rows: {manifest['row_count']}.",
        "Fixed development and frozen challenge: independently authored, no random seed.",
        f"Fixed development cases: {result['fixture_case_counts']['development']}; challenge cases: {result['fixture_case_counts']['challenge']}.",
        f"Challenge frozen normalized-UTF-8 SHA-256: `{CHALLENGE_SHA256}`.",
        "",
        "## Dataset provenance",
        "",
        "| Persona | Rows | Start | End |",
        "| --- | ---: | --- | --- |",
    ]
    for persona, coverage in manifest["personas"].items():
        lines.append(f"| {persona} | {coverage['row_count']} | {coverage['start']} | {coverage['end']} |")
    for split, digest in result["fixture_hashes"].items():
        lines.extend(["", f"{split} decoded UTF-8 (newline-normalized by Python) SHA-256: `{digest}`."])

    # Define denominators and undefined cases before presenting rounded rates.
    lines.extend([
        "",
        "## Metric definitions",
        "",
        "Accuracy = correct categories / all labeled rows, including correctly predicted Uncategorized.",
        "Abstain rate = Uncategorized predictions / all rows, including correct abstentions.",
        "Confident mistakes = wrong predictions with confidence > 0; rate denominator is all rows.",
        "Class precision = true positives / predicted class rows; recall = true positives / labeled class rows.",
        "Candidate precision = TP / (TP + FP); recall = TP / (TP + FN), by kind and unordered ID pair.",
        "Labels describe candidate eligibility, including legitimate repeated purchases, never deletion decisions.",
        "Zero denominators are N/A; rates are fractions rounded to six decimals; counts are exact.",
        f"Baseline always predicts **{result['baseline_category']}**, the majority of generated plus fixed development labels.",
        "Baseline ties use the documented category order. Challenge labels never fit the baseline or rules.",
    ])
    for split, scores in result["splits"].items():
        metrics = scores["category"]
        comparison = "fewer than" if metrics["confident_mistakes"] < metrics["abstentions"] else "not fewer than"
        lines.extend([
            "",
            f"## {split}",
            "",
            f"Rows: {metrics['rows']}; correct: {metrics['correct']}; accuracy: {_display(metrics['accuracy'])}.",
            f"Abstentions: {metrics['abstentions']}; rate: {_display(metrics['abstain_rate'])}.",
            f"Confident mistakes: {metrics['confident_mistakes']}; rate: {_display(metrics['confident_mistake_rate'])}.",
            f"Confident mistakes are {comparison} abstentions; this is an observation, not a regression threshold.",
            f"Majority baseline correct: {scores['baseline_correct']}/{metrics['rows']}; accuracy: {_display(scores['baseline_accuracy'])}.",
            "",
            "| Category | Support | Predicted | TP | Precision | Recall |",
            "| --- | ---: | ---: | ---: | ---: | ---: |",
        ])
        for category, values in metrics["per_category"].items():
            lines.append(
                f"| {category} | {values['support']} | {values['predicted']} | "
                f"{values['true_positive']} | {_display(values['precision'])} | {_display(values['recall'])} |"
            )
        lines.extend([
            "",
            "| Candidate kind | Expected | Predicted | TP | FP | FN | Precision | Recall |",
            "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
        ])
        for kind, values in scores["pairs"].items():
            lines.append(
                f"| {kind} | {values['expected']} | {values['predicted']} | {values['true_positive']} | "
                f"{values['false_positive']} | {values['false_negative']} | "
                f"{_display(values['precision'])} | {_display(values['recall'])} |"
            )
    lines.extend([
        "",
        "## Limitations and gates",
        "",
        "Forecast MAE, range coverage and forecast baseline comparisons: N/A; forecasting is outside V1.",
        "Small invented vocabularies and synthetic cases cannot establish real-world performance.",
        "Frozen challenge failures are reported without tuning rules or revising challenge answers.",
        "CI gates tests, input/output integrity and report generation; no numerical quality threshold is frozen.",
        "Candidates require backend/user confirmation and never change totals automatically.",
        "Hosted CI execution and external team handoff require separate observed evidence.",
        "",
    ])
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Evaluate fixed synthetic ML V1 data offline.")
    parser.add_argument("--out", type=Path, default=Path("reports/eval_v1.md"))
    parser.add_argument("--fixtures", type=Path, default=Path("tests/ml/fixtures"))
    args = parser.parse_args(argv)

    # Fail closed without printing exception payloads that might contain row text.
    try:
        result = evaluate(args.fixtures)
        report = render_report(result, source_metadata(Path.cwd()))
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(report, encoding="utf-8")
    except (OSError, ValueError, TypeError, KeyError, AssertionError):
        print(
            "ML V1 evaluation failed; check synthetic fixtures, contracts and output access.",
            file=sys.stderr,
        )
        return 2
    print("ML V1 synthetic evaluation report written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
