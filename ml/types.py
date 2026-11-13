"""Immutable typed boundaries for canonical backend-owned transactions."""

from dataclasses import dataclass, field
from datetime import date as Date, time as Time
from math import isfinite
from typing import Literal, get_args

from ai.banks import BANKS as BANK_ALIASES

MODEL_VERSION = "ml-0.1.0"

Category = Literal[
    "Food",
    "Transport",
    "Airtime and Data",
    "Entertainment",
    "Shopping",
    "Bills and Utilities",
    "Education",
    "Health",
    "Savings and Transfers",
    "Income",
    "Uncategorized",
]

CATEGORIES: tuple[str, ...] = get_args(Category)
# Read institution values from the shared alias registry, preserving its order.
_bank_values = list(BANK_ALIASES.values())
_bank_values.append("other")
_unique_banks = dict.fromkeys(_bank_values)
BANKS: tuple[str, ...] = tuple(_unique_banks)
Direction = Literal["debit", "credit"]
CandidateKind = Literal["duplicate", "internal_transfer"]
Method = Literal["rule"]


def _require_text(value: object, name: str, *, allow_empty: bool = False) -> None:
    # Report field names only so invalid records cannot leak descriptions or IDs.
    if not isinstance(value, str):
        raise TypeError(f"{name} must be a string")
    if not allow_empty and not value.strip():
        raise ValueError(f"{name} must be nonblank")


def _validate_metadata(confidence: float, method: Method, model_version: str) -> None:
    # Keep metadata meaningful without treating rule strengths as probabilities.
    if type(confidence) is not float:
        raise TypeError("confidence must be a float")
    if not isfinite(confidence) or not 0.0 <= confidence <= 1.0:
        raise ValueError("confidence must be finite and between zero and one")

    _require_text(method, "method")
    _require_text(model_version, "model_version")

    if method != "rule":
        raise ValueError("method must be rule for V1")
    if model_version != MODEL_VERSION:
        raise ValueError("model_version must match the current model version")


@dataclass(frozen=True)
class Txn:
    """A canonical NGN transaction, already converted to kobo by the backend."""

    id: str
    date: Date
    time: Time | None
    description: str = field(repr=False)
    amount_kobo: int
    direction: Direction
    account_alias: str
    reference: str | None
    bank: str

    def __post_init__(self) -> None:
        # Validate the typed boundary without parsing CSV or coercing money/text.
        _require_text(self.id, "id")
        _require_text(self.description, "description", allow_empty=True)
        _require_text(self.account_alias, "account_alias")
        _require_text(self.bank, "bank")
        if self.reference is not None:
            _require_text(self.reference, "reference")

        if type(self.date) is not Date:
            raise TypeError("date must be a calendar date")
        if self.time is not None:
            if not isinstance(self.time, Time):
                raise TypeError("time must be a time or None")
            if self.time.tzinfo is not None:
                raise ValueError("time must be naive")

        if type(self.amount_kobo) is not int:
            raise TypeError("amount_kobo must be an integer")
        if self.amount_kobo <= 0:
            raise ValueError("amount_kobo must be positive")
        _require_text(self.direction, "direction")
        if self.direction not in ("debit", "credit"):
            raise ValueError("direction must be debit or credit")
        # Keep bank values aligned with the upstream alias normalizer output.
        if self.bank not in BANKS:
            raise ValueError("bank must be a supported normalized bank")


@dataclass(frozen=True)
class CategoryResult:
    """One category associated with its original transaction ID."""

    txn_id: str
    category: Category
    confidence: float
    method: Method = "rule"
    model_version: str = MODEL_VERSION

    def __post_init__(self) -> None:
        # Reject invalid result shapes before callers persist or explain them.
        _require_text(self.txn_id, "txn_id")
        _require_text(self.category, "category")
        if self.category not in CATEGORIES:
            raise ValueError("category must be a supported category")
        _validate_metadata(
            self.confidence,
            self.method,
            self.model_version,
        )


@dataclass(frozen=True)
class Candidate:
    """Evidence for reviewing a pair, never permission to change totals."""

    id: str
    kind: CandidateKind
    txn_ids: tuple[str, str]
    reason: str
    confidence: float
    method: Method = "rule"
    model_version: str = MODEL_VERSION

    def __post_init__(self) -> None:
        # Canonical immutable pairs keep candidate association unambiguous.
        _require_text(self.id, "id")
        _require_text(self.kind, "kind")
        _require_text(self.reason, "reason")
        if self.kind not in ("duplicate", "internal_transfer"):
            raise ValueError("kind must be duplicate or internal_transfer")
        if not isinstance(self.txn_ids, tuple) or len(self.txn_ids) != 2:
            raise TypeError("txn_ids must be a two-item tuple")
        for txn_id in self.txn_ids:
            _require_text(txn_id, "txn_ids")
        if self.txn_ids[0] >= self.txn_ids[1]:
            raise ValueError("txn_ids must be sorted and distinct")

        _validate_metadata(
            self.confidence,
            self.method,
            self.model_version,
        )


def validate_transactions(txns: list[Txn]) -> None:
    """Check call-level ID uniqueness without changing or logging the inputs."""
    # Pair identity depends on unique IDs, even when transaction values differ.
    if not isinstance(txns, list):
        raise TypeError("txns must be a list of Txn objects")
    seen_ids: set[str] = set()
    for txn in txns:
        if not isinstance(txn, Txn):
            raise TypeError("txns must contain only Txn objects")
        if txn.id in seen_ids:
            raise ValueError("transaction IDs must be unique within a call")
        seen_ids.add(txn.id)
