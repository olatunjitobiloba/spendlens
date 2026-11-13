"""Conservative whole-word rules over canonical transaction descriptions."""

from importlib.resources import files
import json
from typing import cast

from ml.normalize import normalize_description
from ml.types import CATEGORIES, Category, CategoryResult, Txn, validate_transactions


def _load_rules() -> dict[Category, tuple[str, ...]]:
    # Read packaged JSON-compatible YAML without a runtime YAML dependency.
    resource = files("ml").joinpath("rules/categories.yaml")
    document = json.loads(resource.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or set(document) != set(CATEGORIES):
        raise ValueError("rules must contain the exact category vocabulary")

    rules = {}
    for category, phrases in document.items():
        if not isinstance(phrases, list):
            raise ValueError("category rules must be lists")
        if category == "Uncategorized" and phrases:
            raise ValueError("Uncategorized must have no supporting rules")
        for phrase in phrases:
            if not isinstance(phrase, str) or not phrase:
                raise ValueError("rule phrases must be nonempty strings")
            if normalize_description(phrase) != phrase:
                raise ValueError("rule phrases must already be normalized")
        rules[cast(Category, category)] = tuple(phrases)
    return rules


def categorize(txns: list[Txn]) -> list[CategoryResult]:
    """Return ordered rule strengths; missing or conflicting support abstains."""
    validate_transactions(txns)
    if not txns:
        return []

    # Padded normalized text enforces complete words and contiguous phrases.
    rules = _load_rules()
    results = []
    for txn in txns:
        normalized = normalize_description(txn.description)
        padded = f" {normalized} "
        supported = [
            category
            for category, phrases in rules.items()
            if any(f" {phrase} " in padded for phrase in phrases)
        ]

        # Several clues for one category are safe; competing categories abstain.
        category: Category = "Uncategorized"
        confidence = 0.0
        if len(supported) == 1:
            category = supported[0]
            confidence = 0.9
        result = CategoryResult(
            txn_id=txn.id,
            category=category,
            confidence=confidence,
        )
        results.append(result)
    return results
