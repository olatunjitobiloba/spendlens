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




## Step 2 checkpoint: labeled fixtures and seeded generation

Date: 2026-11-11 04:10 WAT (Africa/Lagos). Scope: Step 2 only, explicitly
requested by the owner. Reviewer: primary agent self-review using the review
skill; execution evidence supplied by delegated Luna High. Full-feature review
remains Step 6.

### Requirement audit

| Requirement | Implementation and observed evidence | Status |
| --- | --- | --- |
| Expected answers before detector work | Development and challenge JSON have separate canonical transaction arrays, exact category/confidence maps and candidate kind/pair/confidence lists. No categorizer, rules or reconciler exists yet. | Implemented |
| Fixed challenge independence | Independently worded invented descriptions, disjoint from development descriptions; authored against the same boundary matrix before rules. No model or production data involved. Fixture is not loaded by the generator. | Implemented; test result below |
| Seeded personas and coverage (AC7) | `generate_dataset` defaults to seed 20261111; tests also use 7. Each persona has 373 rows, every day January 1–June 30, 2026 (181 dates); 746 total rows. Local `Random` leaves caller randomness unchanged; IDs and ordering remain stable. | Implemented; test result below |
| Separate truth | Frozen dataset holds transaction tuples separately from category, persona and candidate labels; only canonical `Txn` objects are passed to future detectors. Money stays positive integer kobo and normalized bank metadata is required. | Implemented |
| All required edge cases | Fixtures cover repeat imports, legitimate identical purchases, reference/account/direction/date/amount boundaries, normalization, fees, refunds, ambiguous and absent evidence, missing counterparts, both date directions and multiple counterpart pairs. Generator injects six named edge cases per persona and mixed missing/present times. | Implemented |
| Local run | Required generator exercise delegated through the exact Step 2 pytest command. | See verification results |

### Changed files and responsibilities

- `ml/synthetic.py`: pure standard-library generator, immutable data/label
  containers and derived manifest; no fixture/rule reads, logging or services.
- `tests/ml/fixtures/development.json`: 23 cases, 57 rows, 10 expected candidate
  pairs and all eleven category names, for future rule development.
- `tests/ml/fixtures/challenge.json`: 23 independently worded cases, 57 rows and
  10 expected candidate pairs. Same boundary matrix, separately stored answers;
  no claims of an independent human reviewer or statistical representativeness.
- `tests/ml/test_synthetic.py`: canonical fields, exact pair truth (each case
  and concatenated split), coverage, manifest, edge category answers, determinism,
  global-random isolation and invalid seed checks.
- Feature plan status, feature progress, this review and project tracker record
  the authorization and checkpoint. Existing unrelated worktree changes preserved.

Manifest: schema 1; seeds 20261111 (default) and 7 (alternate verification);
746 generated rows, 373 per persona, six candidate pairs. Each persona spans
2026-01-01 through 2026-06-30. Fixed fixtures are unseeded authored examples.
Challenge freeze SHA-256 of UTF-8 text with normalized LF newlines:
`9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`.
Freeze is established at this checkpoint, after fixture-integrity repairs and
before category-rule implementation. Future challenge failures must be reported
without tuning rules against its answers. Synthetic accuracy does not establish
real-world accuracy; Step 2 measures no detector performance.

### Verification results

All test runs used delegated `gpt-6-luna`, reasoning `high`, from the repository
root, with `python -m pytest tests/ml/test_synthetic.py tests/ml/test_contracts.py`
under Python 3.13.15 / pytest 8.3.4. An initial assumed virtual-environment
executable did not resolve (exit 1); no tests ran in that attempt. Default Python
provided the available environment without installation.

First execution: exit 1, 54 collected, 51 passed, three failed. The hash pinned
raw checkout bytes rather than normalized text, and pair auditing found two
unlabeled cross-persona transfers. Fixed the hash convention and reserved
non-round principal amounts per persona, separate from random daily amounts.
Also isolated fixed fixture cases by amount and added concatenated-split pair
auditing, preventing hidden cross-case positives.

Second execution: exit 1, 54 collected, 53 passed, one failed. Independence
checking caught identical digits/punctuation-only text in the two splits. Rewrote
the challenge spelling and updated its freeze hash before rule work.

Final focused execution: exit 0, 54 passed, 0 failed; no warnings shown (29.81 seconds).

Tracked-change `git diff --check` passed. Git could not read the sandbox user's global ignore file; repository-local inspection succeeded with a command-local
`safe.directory` override. No global Git setting was changed.

### Design critique and UI verification

No UI or server applies. Candidate labels remain review evidence, including
legitimate repeated purchases; fees are separate rows and refunds are negative
V1 cases. Descriptions are invented and are not logged. Self-review findings
were fixed within Step 2; no governing law, result contract or dependency changed.

### Remaining proof

AC7 data-generation evidence belongs to this checkpoint. AC8 challenge provenance
and freeze are established; separate development/challenge evaluation sections
remain Step 5. Categorization, reconciliation, installed-resource/CLI checks,
report metrics, CI and complete acceptance review remain later steps. Python
versions other than 3.13 were not exercised. No Python lint/type checker is
configured; no UI, live provider, full-suite or performance claim is made.

Verdict: **Approve for Step 2; no remaining Step 2 findings. Stop for owner `NEXT` before Step 3**.

## Step 3 checkpoint: conservative categorization

Date: 2026-11-13 02:28 WAT (Africa/Lagos). Scope: Step 3 only, explicitly
requested by the owner. Reviewer: primary agent self-review using the review
skill; tests and installed-package checks executed by delegated `gpt-6-luna`
at `high` reasoning. This is not an independent review or the Step 6 audit.

### Requirement audit

| Requirement | Implementation and observed evidence | Status |
| --- | --- | --- |
| Expectations before logic | Added normalization and categorization expectations first, then implemented rules. Development fixtures/templates guided vocabulary; frozen challenge answers were not consulted or evaluated. | Passed |
| Shared normalization and exact boundaries | `normalize_description` follows the Step 2 development oracle: lowercase, replace non-ASCII-letter/non-whitespace characters with spaces, collapse whitespace. Exact tests pin digits, punctuation, case, spacing, token splitting, substring negatives and contiguous phrases. | Passed |
| Category vocabulary and conservative support (AC3) | JSON-compatible YAML has all eleven categories and no Uncategorized clues. Multiple same-category clues return 0.9; absent/conflicting evidence returns Uncategorized at 0.0. Tests cover every category and development fixture answer. | Passed |
| Cardinality, order, IDs, nonmutation and determinism | Public `from ml import categorize`; tests exercise empty input and reversed generated histories for seeds 20261111 and 7, 746 rows each. Results preserve order/IDs, metadata and repeat-call equality; inputs remain unchanged. Invalid containers/elements and duplicate IDs use the Step 1 validator. | Passed |
| Pure package and evidence boundary | Source reads only description plus ID association; no label/generator/AI/backend imports, network, logging or totals changes. Metadata-only changes cannot create category support. | Passed |
| Packaged resource and required local run | Regular install into an isolated venv, copied suite outside checkout, and installed public-function/resource smoke all passed. Paths resolve under that venv's site-packages. | Passed |
| Challenge freeze | Normalized-LF SHA-256 unchanged at `9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`. Challenge metrics remain Step 5; no tuning against held-out failures. | Passed |

### Changed files and responsibilities

- `ml/normalize.py`: shared deterministic text helper for categorization and
  future reconciliation; ASCII boundaries agree with the development oracle.
- `ml/categorize.py`: validated ordered categorization and package-resource
  loading; rule vocabulary validation fails closed with field-only errors.
- `ml/rules/categories.yaml`: small development-derived word/phrase vocabulary,
  parsed by the standard JSON library; no YAML or other runtime dependency.
- `ml/__init__.py`: public categorizer export. `pyproject.toml` changes only
  its package-data comment; the existing resource mapping suffices.
- `tests/ml/test_normalize.py`, `tests/ml/test_categorize.py` and
  `tests/ml/test_package.py`: exact behavior, separate development answers,
  determinism/ordering, typed-call errors and packaged-resource proof.
- `docs/ml_v1_handoff.md`: current callable behavior, text boundaries, confidence
  semantics and resource status; Step 4 candidate contract remains unchanged.
- Feature status/progress, this evolving review and project tracker record the
  authorization and verified checkpoint; governing laws were not edited.

### Verification results

All acceptance commands below were delegated to Luna High. Repository cwd:
`C:\Users\Caleb Babatunde\Documents\GitHub\spendlens`.
Temporary verification root (T):
`C:\Users\Caleb Babatunde\AppData\Local\Temp\spendlens-step3-7cedad24-d1a9-4c21-befc-f611c2640d5c`.
Venv interpreter (P): `T\venv\Scripts\python.exe`, Python 3.13.15.
T/P below expand to these exact paths; PowerShell invocation uses `&` for P.

| Command / working directory | Observed result |
| --- | --- |
| `python -m pytest tests/ml/test_normalize.py tests/ml/test_categorize.py tests/ml/test_package.py --tb=no` / repository | Initial pre-install run: exit 1, 40 passed, 1 failed (`test_installed_distribution`). No behavior test failed. |
| `python -m venv --system-site-packages T\venv`; `P -m pip install --no-build-isolation --no-deps .` / repository | Regular wheel built and installed, exit 0, `spendlens-ml` 0.1.0. No dependency download needed. Wheel SHA-256 `95931552605feef8eb83eea8343ebb03409244b7b1bb81205db4fb49fa086b60`. |
| `python -m pytest tests/ml/test_package.py::test_installed_distribution --tb=short` / repository after install | Exit 0, 1 passed; initial metadata setup failure resolved. |
| `P -m pytest tests/ml/test_normalize.py tests/ml/test_categorize.py tests/ml/test_package.py --tb=no` / repository | Exit 0, 41 passed, 0 failed. |
| `P -m pytest checks --import-mode=importlib -o pythonpath= --tb=no` / T | Copied current three modules and development fixture: exit 0, 41 passed, 0 failed. No repository pytest config/source path injected. |
| Installed-package smoke / T | Passed: `ml.__file__` is `T\venv\Lib\site-packages\ml\__init__.py`; resource is under `T\venv\Lib\site-packages\ml\rules\categories.yaml`. Public categorization preserves order and returns expected category/confidence/method/version metadata. |
| Challenge integrity | Normalized-LF UTF-8 SHA-256 matches the Step 2 freeze. |

Main-agent source/diff inspection found no Step 3 defects. `git diff --check`
passed before the documentation checkpoint; final documentation check is recorded
below. Installer-created `build/` and `spendlens_ml.egg-info/` were absent at
baseline and removed only after Luna confirmed no live installer or test
remained, using checked absolute paths within this workspace. Temporary venv
and copied checks remain outside checkout. Existing unrelated untracked context
and handoff documents were preserved; only authorized tracker/handoff changes
were made. Git's sandbox global-ignore access warning remains an environment
limit; command-local safe.directory enables repository inspection.

### Design critique and UI verification

No UI/server applies. This is intentionally a small explicit vocabulary, with
whole-word/contiguous-phrase support and conservative abstention; it is not a
general merchant classifier. Unicode transliteration is not implemented; the
ASCII normalization matches the pre-existing development boundary oracle.
Confidence is rule strength, not calibrated probability. No financial total is
calculated or changed. No contract, dependency or feature-scope revision needed.

### Remaining proof

AC3 is verified. AC1/AC6 now have installed categorizer/resource and category
metadata proof but still await reconciler/candidate identity and CLI checks.
AC8 separate challenge evaluation remains Step 5. Reconciliation, report metrics,
CI, full suites/AI regression checks and complete acceptance review remain their
planned later steps. No Python lint/type checker is configured; Python versions
other than 3.13 were not exercised. The venv reused system test/build tooling,
so this is isolated package installation rather than clean dependency provisioning.
Synthetic accuracy does not establish real-world accuracy.

Verdict: **Approve for Step 3; no remaining Step 3 findings. Stop for owner
`NEXT` before Step 4.**

Final Step 3 documentation check: `git diff --check` passed after tracking
updates; required tracker headings/table columns preserved. No later step started.
