"""Conservative duplicate and internal-transfer evidence for backend review."""

from collections import defaultdict
from datetime import date
from hashlib import sha256
from itertools import combinations
import json

from ml.normalize import normalize_description
from ml.types import Candidate, CandidateKind, Txn, validate_transactions

TRANSFER_CLUES = frozenset({"transfer"})


def _candidate(
    kind: CandidateKind,
    first: Txn,
    second: Txn,
    confidence: float,
    reason: str,
) -> Candidate:
    # Encode only kind and sorted IDs so identity survives input permutations.
    first_id, second_id = sorted((first.id, second.id))
    identity = json.dumps(
        [kind, first_id, second_id],
        ensure_ascii=True,
        separators=(",", ":"),
    )
    identity_bytes = identity.encode("utf-8")
    identity_hash = sha256(identity_bytes)
    digest = identity_hash.hexdigest()
    return Candidate(
        id=f"{kind}:{digest}",
        kind=kind,
        txn_ids=(first_id, second_id),
        reason=reason,
        confidence=confidence,
    )


def find_reconciliation_candidates(txns: list[Txn]) -> list[Candidate]:
    """Return all eligible pairs without changing transactions or totals."""
    # Validate before indexing; unique caller IDs are required for pair identity.
    validate_transactions(txns)
    duplicate_groups: dict[tuple[str, str, int, date, str], list[Txn]] = defaultdict(list)
    credits: dict[tuple[int, int], list[Txn]] = defaultdict(list)
    debits: list[Txn] = []
    transfer_ids: set[str] = set()

    # Normalize once per row and index only fields used by the written rules.
    for txn in txns:
        description = normalize_description(txn.description)
        duplicate_key = (
            txn.account_alias,
            txn.direction,
            txn.amount_kobo,
            txn.date,
            description,
        )
        duplicate_groups[duplicate_key].append(txn)
        description_words = description.split()
        if TRANSFER_CLUES.intersection(description_words):
            transfer_ids.add(txn.id)
        if txn.direction == "credit":
            credit_key = (txn.amount_kobo, txn.date.toordinal())
            credits[credit_key].append(txn)
        else:
            debits.append(txn)

    # Reference conflicts veto duplicates; absent references weaken the evidence.
    results: list[Candidate] = []
    for group in duplicate_groups.values():
        for first, second in combinations(group, 2):
            both_references = (
                first.reference is not None
                and second.reference is not None
            )
            if both_references and first.reference != second.reference:
                continue
            confidence = 0.9 if both_references else 0.6
            if both_references:
                reference_reason = "Matching references."
            else:
                reference_reason = "At least one reference absent."
            reason = (
                "Review possible duplicate: same account, direction, amount, "
                "calendar date and normalized description. "
                + reference_reason
            )
            candidate = _candidate(
                "duplicate",
                first,
                second,
                confidence,
                reason,
            )
            results.append(candidate)

    # Opposite entries may book in either date order; fees are never netted.
    for debit in debits:
        for offset in (-1, 0, 1):
            credit_key = (debit.amount_kobo, debit.date.toordinal() + offset)
            for credit in credits.get(credit_key, ()):
                if debit.account_alias == credit.account_alias:
                    continue
                if debit.id not in transfer_ids and credit.id not in transfer_ids:
                    continue
                candidate = _candidate(
                    "internal_transfer",
                    debit,
                    credit,
                    0.8,
                    "Review possible internal transfer: equal debit and credit amounts "
                    "across different accounts within one calendar day, with a transfer clue.",
                )
                results.append(candidate)

    # Stable ordering makes repeated calls and reordered imports comparable.
    return sorted(results, key=lambda item: (item.kind, item.txn_ids))
