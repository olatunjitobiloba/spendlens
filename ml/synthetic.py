"""Seeded invented histories with ground truth kept outside canonical inputs.

No fixture or rule files are read here. Labels describe review candidates,
including legitimate repeated purchases; they never authorize exclusions.
"""

from dataclasses import dataclass
from datetime import date, time, timedelta
from random import Random

from ml.types import BANKS, Category, Txn

DEFAULT_SEED = 20261111
PERSONAS = ("student_allowance", "early_career_salary")

# These invented templates are development data, never challenge answers.
TEMPLATES: tuple[tuple[str, Category], ...] = (
    ("POS River Canteen rice", "Food"),
    ("Lagos bus fare", "Transport"),
    ("MTN airtime recharge", "Airtime and Data"),
    ("Cinema ticket", "Entertainment"),
    ("Clothing purchase", "Shopping"),
    ("Electricity utility bill", "Bills and Utilities"),
    ("School tuition", "Education"),
    ("Pharmacy medicine", "Health"),
    ("Transfer to savings", "Savings and Transfers"),
    ("Payment", "Uncategorized"),
)


@dataclass(frozen=True)
class PairLabel:
    kind: str
    txn_ids: tuple[str, str]
    confidence: float


@dataclass(frozen=True)
class SyntheticDataset:
    transactions: tuple[Txn, ...]
    category_labels: tuple[tuple[str, Category], ...]
    candidate_labels: tuple[PairLabel, ...]
    persona_labels: tuple[tuple[str, str], ...]
    edge_cases: tuple[tuple[str, tuple[str, ...]], ...]
    seed: int

    def manifest(self) -> dict[str, object]:
        """Return reproducibility metadata without transaction descriptions."""
        # Derive counts and dates from actual inputs rather than planned totals.
        personas = dict(self.persona_labels)
        coverage = {}
        for persona in PERSONAS:
            dates = [
                txn.date for txn in self.transactions
                if personas[txn.id] == persona
            ]
            coverage[persona] = {
                "row_count": len(dates),
                "start": min(dates).isoformat(),
                "end": max(dates).isoformat(),
            }
        return {
            "schema_version": 1,
            "seed": self.seed,
            "row_count": len(self.transactions),
            "personas": coverage,
            "candidate_count": len(self.candidate_labels),
            "synthetic_only": True,
            "caveat": "Synthetic accuracy does not establish real-world accuracy.",
        }


def generate_dataset(seed: int = DEFAULT_SEED) -> SyntheticDataset:
    """Generate January–June 2026 histories using a private random stream."""
    if type(seed) is not int:
        raise TypeError("seed must be an integer")

    rng = Random(seed)
    transactions = []
    categories = []
    personas = []
    pairs = []
    edges = []

    # Isolated accounts and distinct amounts prevent accidental pair labels.
    for persona_index, persona in enumerate(PERSONAS):
        for day in range(181):
            current_date = date(2026, 1, 1) + timedelta(days=day)
            for slot in range(2):
                description, category = rng.choice(TEMPLATES)
                direction = "debit"
                amount = rng.randrange(100, 50000) * 100
                if current_date.day == 1 and slot == 0:
                    description = "Allowance received"
                    amount = 8000000
                    if persona == "early_career_salary":
                        description = "Monthly salary"
                        amount = 25000000
                    category = "Income"
                    direction = "credit"

                transaction_time = None
                if slot == 1:
                    transaction_time = time(hour=12, minute=day % 60)

                txn_id = f"{persona}-{day:03d}-{slot}"
                txn = Txn(
                    id=txn_id,
                    date=current_date,
                    time=transaction_time,
                    description=description,
                    amount_kobo=amount,
                    direction=direction,
                    account_alias=f"{persona}-daily-{slot}",
                    reference=f"generated-{txn_id}",
                    bank=BANKS[day % len(BANKS)],
                )
                transactions.append(txn)
                categories.append((txn_id, category))
                personas.append((txn_id, persona))

        # Fixed edge injections keep explicit answers independent of random draws.
        specifications = (
            (
                "repeat_import",
                ("POS River Canteen rice",) * 2,
                ("debit",) * 2,
                (50000, 50000),
                ("same", "same"),
                False,
                "duplicate",
                0.9,
            ),
            (
                "legitimate_identical_purchase",
                ("Lagos bus fare",) * 2,
                ("debit",) * 2,
                (60000, 60000),
                (None, None),
                False,
                "duplicate",
                0.6,
            ),
            (
                "transfer_fee",
                ("Transfer to own wallet", "Own wallet funding", "Service fee"),
                ("debit", "credit", "debit"),
                (70000, 70000, 1000),
                (None,) * 3,
                True,
                "internal_transfer",
                0.8,
            ),
            (
                "refund",
                ("POS River Canteen rice", "Reversal settlement"),
                ("debit", "credit"),
                (80000, 80000),
                (None, None),
                False,
                None,
                0.0,
            ),
            (
                "missing_counterpart",
                ("Transfer to external wallet",),
                ("debit",),
                (90000,),
                (None,),
                False,
                None,
                0.0,
            ),
            (
                "ambiguous",
                ("Food transport",),
                ("debit",),
                (100000,),
                (None,),
                False,
                None,
                0.0,
            ),
        )
        for (
            name,
            descriptions,
            directions,
            amounts,
            references,
            different_accounts,
            kind,
            confidence,
        ) in specifications:
            ids = []
            for index, description in enumerate(descriptions):
                txn_id = f"{persona}-edge-{name}-{index}"
                account = f"{persona}-edge-{name}"
                if different_accounts and index == 1:
                    account += "-counterpart"
                category: Category = "Uncategorized"
                if name in ("repeat_import", "refund") and index == 0:
                    category = "Food"
                if name == "repeat_import":
                    category = "Food"
                if name == "legitimate_identical_purchase":
                    category = "Transport"
                if description.startswith("Transfer"):
                    category = "Savings and Transfers"

                # Reserve non-round amounts per persona to avoid cross-history pairs.
                edge_amount = amounts[index]
                if edge_amount != 1000:
                    edge_amount += persona_index + 1

                txn = Txn(
                    id=txn_id,
                    date=date(2026, 4, 15),
                    time=None,
                    description=description,
                    amount_kobo=edge_amount,
                    direction=directions[index],
                    account_alias=account,
                    reference=references[index],
                    bank="other",
                )
                transactions.append(txn)
                categories.append((txn_id, category))
                personas.append((txn_id, persona))
                ids.append(txn_id)

            edges.append((name, tuple(ids)))
            if kind is not None:
                pair_ids = tuple(sorted(ids[:2]))
                pair_label = PairLabel(
                    kind=kind,
                    txn_ids=pair_ids,
                    confidence=confidence,
                )
                pairs.append(pair_label)

    # Date/ID ordering is stable and makes histories usable without label access.
    transactions.sort(key=lambda txn: (txn.date, txn.id))
    return SyntheticDataset(
        transactions=tuple(transactions),
        category_labels=tuple(categories),
        candidate_labels=tuple(pairs),
        persona_labels=tuple(personas),
        edge_cases=tuple(edges),
        seed=seed,
    )
