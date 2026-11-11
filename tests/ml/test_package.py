"""Public package checks, also copied outside the checkout for install verification."""

from importlib import metadata

import ml
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


def test_installed_distribution():
    # Test environments install the project, so missing metadata is a real failure.
    distribution = metadata.distribution("spendlens-ml")
    assert distribution.version == ml.__version__
    assert distribution.metadata["Requires-Python"] == ">=3.10"

    requirements = distribution.requires or []
    runtime_requirements = [item for item in requirements if "extra ==" not in item]
    assert runtime_requirements == []
