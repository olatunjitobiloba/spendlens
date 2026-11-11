# Planning checkpoint: ML V1 feature specification

Date: 2026-11-05 00:23 WAT (Africa/Lagos). Scope: V1 planning documents,
source alignment and required tracking structure. Reviewer: primary agent,
manual source/document comparison; no delegated code review or test execution.

## Requirement audit

| Requirement | Implementation and observed evidence | Status |
| --- | --- | --- |
| Explicit first-feature scope | Owner requested first feature-spec for V1; plan includes V1 only from ML_PLAN.md. | Passed |
| Required planning files and links | Plan, matching progress and this single review record created; project tracker links all three. | Passed |
| Ordered steps and final verification | Six steps specify files, dependencies, checks, runtime requirements and NEXT gates; final step audits AC1–AC11. | Passed |
| Team agreement for proposed fields | Owner explicitly confirmed agreement for model_version and candidate method in this conversation. | Passed |
| Package and CLI naming | Owner directed the package/import name to be `ml` and the command `python -m ml.eval.run`; ML_PLAN.md, architecture, code standards, tracker and feature records now use that name. | Passed |
| Exact result shape freeze | Plan makes concrete output schemas visibly proposed for Step 1 review. | Pending |
| Evaluation CLI purpose | Plan specifies one non-interactive command to run the fixed synthetic evaluation locally and in CI and write the report; it does not alter rule behavior. | Passed |
| Runtime acceptance AC1–AC11 | No ML implementation was performed; criteria and future proof are documented. | Pending |

## Changed files and responsibilities

- `context/feature-spec/01-ml-v1/ml-v1.md`: V1 scope, contracts, acceptance,
  expected files, six ordered implementation steps and verification requirements.
- `context/feature-spec/01-ml-v1/ml-v1-progress.md`: planning checkpoint and
  unstarted implementation steps; links this review history.
- `context/feature-spec/01-ml-v1/review.md`: initial planning evidence using the
  exact PROJECT_STARTER.md review outline.
- `context/progress-tracker.md`: active V1 planning, links and confirmed field
  agreement; no application milestone marked complete.

## Verification results

| Command or observed check | Result |
| --- | --- |
| Read AGENTS.md and five always-required context documents | Completed before feature drafting. |
| Read ML_PLAN.md and PROJECT_STARTER.md planning/review requirements | Completed; V1 and exact review outline used. |
| Inspect manifests, README, AI contracts/tests, ml/ and api/ | ML/API contain only .gitkeep; root pyproject has pytest settings only; existing AI contract preserved in plan. |
| Inspect worktree | Initial git status failed ownership guard; command-local safe.directory allowed read-only status. Existing changes preserved. |
| Application tests/evaluation | Not run; documentation-only planning. Future execution must use Luna High. |

No implementation, installation, CI or measured model-quality result is claimed.
Git warned that the sandbox cannot read the user's global ignore file; this did
not prevent repository-local inspection. No global Git configuration was edited.
The initial document write stalled after two files; it was stopped, the written
files inspected, and the remaining records written separately.

## Design critique and UI verification

Not applicable: this feature is a pure Python ML package and this checkpoint
changes only Markdown planning records. No UI flow or device was exercised.

## Remaining proof

- Owner review of the draft before Step 1.
- Step 1 concrete schema review and package verification.
- All implementation acceptance tests, report metrics and runtime checks.
- Authorized hosted CI run and recipient confirmation before external handoff.

Verdict: **Approve with limitations**. Planning scope and required record format
are ready for owner review. This is not implementation approval or completion;
implementation remains unstarted and all runtime criteria remain pending.

## Contract update checkpoint

Date: 2026-11-11 00:43 WAT (Africa/Lagos). Scope: add the requested bank
institution metadata to the Step 1 ML transaction contract and align the plan,
architecture, handoff and tracking records. Reviewer: primary agent, source
comparison; no automated tests or installation checks run for this update.

### Finding and resolution

The owner clarified that “Bank Category” means the financial institution
(GTBank, OPay, and similar), matching the existing `bank` field in
`ai/schemas.py`. `ai/banks.py` maps known aliases to `opay`, `gtbank`, `ecobank`,
`access`, or `zenith`; unknown/missing input maps to `other`. The ML `Txn` now
carries this normalized value as optional `bank`, default `other`. ML does not
import AI code or use the field for category or reconciliation decisions. The
table can join it to category output by transaction ID and display it under
“Bank Category.”

### Changed files and verification

Updated `ml/types.py`, `ml/__init__.py`, the existing contract expectation,
`ML_PLAN.md`, governing architecture/product/code-standard context,
`docs/ml_v1_handoff.md`, and the V1 plan, progress and tracker. Source and
contract documentation were inspected after editing. Tests and isolated package
installation remain pending; this update does not complete Step 1 verification.

Verdict: **Contract change recorded; implementation verification pending.**

### Owner clarification: required ML bank field

Date: 2026-11-11 01:15 WAT (Africa/Lagos). The owner clarified that every ML
`Txn` must carry a bank value and explicitly limited the code change to `ml/`;
AI source remains untouched. This supersedes the earlier “optional bank” wording
in the preceding checkpoint. The ML field is required. `other` is a valid
normalized value for an institution outside the current aliases, not a missing
field. Contract documentation and the ML fixture now reflect this. Automated
tests and installation remain pending.

## Step 1 checkpoint: package and concrete contracts

Date: 2026-11-11 02:26 WAT (Africa/Lagos).

### Requirement audit

Step 1's pure-Python `ml` package, concrete frozen transaction/result/candidate
types, required normalized institution bank, field-only validation errors,
version constants, and backend-facing handoff contract are implemented. The
package imports without backend or AI services. Transaction IDs must be unique
within a call. Candidate pair identity is specified for Step 4. The package
contains no categorizer, reconciliation engine, rule resources, or evaluation
CLI yet; those are ordered later steps. Thus the Step 1 portion of the package
and contract acceptance criteria passes, while feature-wide acceptance
criteria remain open.

### Changed files and responsibilities

`pyproject.toml` maps only the `ml` package. `ml/__init__.py` exposes the
public contract; `ml/types.py` validates it. `tests/ml/test_contracts.py` and
`tests/ml/test_package.py` cover values, invalid input, exports and isolation.
`docs/ml_v1_handoff.md` records the backend handoff and future candidate ID
recipe. `ML_PLAN.md`, the ML V1 plan/progress, and the project tracker record
the owner-directed required bank field and Step 1 status. Earlier owner-directed
architecture, product and code-standard updates remain in the worktree.

### Verification results

Luna High ran `python -m pytest tests/ml/test_contracts.py
tests/ml/test_package.py` from the checkout using an editable-install virtual
environment: exit 0, 46 passed, 0 failed/skipped. From an isolated directory
outside the checkout, Luna High ran the copied two test modules under a regular
install with `python -I -m pytest -c pytest.ini --import-mode=importlib
test_contracts.py test_package.py`: exit 0, 46 passed, 0 failed/skipped. Both
runs emitted a `PytestCacheWarning` because Windows denied writing the pytest
cache (WinError 5); this did not affect the test results.

The regular install was confirmed through `pip show spendlens-ml` and a
successful isolated `python -I -c` smoke check from outside the checkout:
`ml.__file__` resolved inside that virtual environment's `site-packages`,
distribution version was `0.1.0`, expected exports were present, and installed
distribution files included `ml/__init__.py` and `ml/types.py` but no `ai`,
`api`, `web` or `tests` package. The pip wrapper did not retain a final process
exit code, so the installation claim rests on those independent checks.
`git diff --check` passed for tracked changes. Generated root `build` and
`.egg-info` directories were removed after their paths and inactive installer
state were verified. All execution used Python 3.13.15.

### Design critique and UI verification

The contract keeps ML independent of the backend and does not log transaction
descriptions. Required bank metadata matches the normalized values supplied
by the existing AI boundary without importing AI code. These are contract and
packaging changes; no UI flow applies to Step 1. Independent full-feature
review is reserved for Step 6.

### Remaining proof

Python 3.10 through 3.12 were not exercised. Public categorization and
reconciliation behavior, stable candidate IDs, rules, evaluation and CLI
behavior remain for later planned steps and their tests. No real-world model
performance is claimed.

Verdict: **Step 1 approved with the stated verification limits; await owner
`NEXT` before Step 2.**



