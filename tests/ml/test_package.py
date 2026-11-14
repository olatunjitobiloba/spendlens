"""Public package checks, also copied outside the checkout for install verification."""

from importlib import metadata
from importlib.resources import files
import json

import ml
from ai.banks import BANKS as BANK_ALIASES, normalize_bank
from ml import Candidate, CategoryResult, Txn


def test_public_exports():
    assert ml.BANKS == (
        "opay", "gtbank", "ecobank", "access", "zenith", "other",
    )
    assert ml.Txn is Txn
    assert ml.CategoryResult is CategoryResult
    assert ml.Candidate is Candidate
    assert ml.__version__ == "0.1.0"
    assert ml.MODEL_VERSION == "ml-0.1.0"
    assert callable(ml.categorize)


def test_bank_registry_is_shared():
    # Every upstream alias must normalize to an accepted ML institution.
    for alias, bank in BANK_ALIASES.items():
        assert normalize_bank(alias) == bank
        assert bank in ml.BANKS

    assert set(ml.BANKS) == set(BANK_ALIASES.values()) | {"other"}
    assert normalize_bank("unknown synthetic institution") == "other"


def test_packaged_rules():
    # This check also runs against a regular install outside the source checkout.
    resource = files("ml").joinpath("rules/categories.yaml")
    rules = json.loads(resource.read_text(encoding="utf-8"))
    assert set(rules) == set(ml.CATEGORIES)
    assert rules["Uncategorized"] == []


def test_installed_distribution():
    # Test environments install the project, so missing metadata is a real failure.
    distribution = metadata.distribution("spendlens-ml")
    assert distribution.version == ml.__version__
    assert distribution.metadata["Requires-Python"] == ">=3.10"

    requirements = distribution.requires or []
    runtime_requirements = [item for item in requirements if "extra ==" not in item]
    assert runtime_requirements == []
