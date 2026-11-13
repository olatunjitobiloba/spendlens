"""Pure spending-review contracts; no backend dependencies or import side effects."""

from ml.types import (
    BANKS,
    CATEGORIES,
    MODEL_VERSION,
    Bank,
    Candidate,
    CategoryResult,
    Txn,
)
from ml.categorize import categorize
from ml.reconcile import find_reconciliation_candidates

__version__ = "0.1.0"

__all__ = [
    "BANKS",
    "CATEGORIES",
    "MODEL_VERSION",
    "Bank",
    "Candidate",
    "CategoryResult",
    "Txn",
    "categorize",
    "find_reconciliation_candidates",
]
