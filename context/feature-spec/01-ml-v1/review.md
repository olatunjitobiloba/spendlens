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

## Step 4 checkpoint: duplicate and internal-transfer candidates

Date: 2026-11-13 10:12 WAT (Africa/Lagos). Scope: exact Step 4, explicitly
requested by the owner. Reviewer: primary agent self-review using the review
skill; execution evidence supplied by delegated `gpt-6-luna` at `high`
reasoning. This is not independent review or the full-feature Step 6 audit.

### Requirement audit

| Requirement | Implementation and observed evidence | Status |
| --- | --- | --- |
| Expectations before logic | Added test_reconcile.py before reconcile.py; reference matrix, boundary cases, all-pair ordering and frozen identity expectation precede detector implementation. Development answers alone guide matching. | Passed |
| Duplicates (AC4) | Same account/direction/amount/date/normalized description; both equal references yield 0.9, conflicting references veto, one/both absent yield 0.6. Tests include legitimate repeated purchases and every required-field mismatch. | Passed |
| Transfers (AC5) | Opposite directions, different accounts, exact equal integer amounts, calendar distance at most one day in either direction, and complete normalized word transfer on either side yield 0.8. Tests cover offsets -2 through +2, both clue sides, unequal amounts, same account/direction, missing counterpart and no clue. | Passed |
| Fee/refund safety | Separate fee rows are not netted into principal amounts; unequal net-credit case returns no candidate. Refund and no-clue negatives remain undetected; no refund-specific matcher added. | Passed |
| Stable identity/order and all eligible pairs (AC6) | Sorted transaction IDs, JSON ensure_ascii=True with compact separators and full SHA-256 implement the frozen recipe. Precomputed duplicate identity assertion, three duplicate plus three transfer pairs, 24 input permutations and reversed generated data pin stable results. Public export, method rule and model version ml-0.1.0 verified. | Passed |
| Explainability, privacy and nonmutation | Reasons describe rule evidence and never interpolate descriptions. Tests assert review wording, absence of a synthetic description marker, unchanged input order/fields; source contains no logging, networking, database, backend/AI import or total mutation. | Passed |
| Existing labeled expectations and required local run | All 23 development cases checked individually and combined; generator seeds 20261111 and 7 checked against separate pair labels. Focused fixture execution through delegated tests passed. No labels enter detector inputs. | Passed |
| Challenge independence | Delegated read-only normalized-LF UTF-8 hash matches the Step 2 freeze. Challenge answers were neither evaluated nor used to tune the detector. | Passed |

### Changed files and responsibilities

- `ml/reconcile.py`: typed public reconciler, duplicate grouping, amount/date
  transfer indexing, conservative clue set, privacy-safe evidence and stable
  candidate identity/order. No runtime dependency added.
- `ml/__init__.py`: expose `find_reconciliation_candidates` consistently with
  the existing public categorizer and frozen backend-facing contract.
- `tests/ml/test_reconcile.py`: exact synthetic expected pairs, boundary and
  safety checks, development fixture execution and generated-label checks.
- `docs/ml_v1_handoff.md`: replace deferred detection wording with implemented
  import, reference/clue/fee semantics and explicit review-only behavior.
- Feature plan status, feature progress, this single review and project tracker:
  owner authorization, observed evidence and the Step 4 checkpoint. Tracker
  headings, columns and section order are preserved. Governing laws and existing
  unrelated worktree changes remain untouched.

Routine implementation choice: `TRANSFER_CLUES = {"transfer"}` matches the
existing development oracle's complete-word test. It does not reuse broader
category rules or infer transfers from account names/bank metadata. Grouping
avoids comparing unrelated duplicate fields and transfer amount/date entries;
every qualifying pair is still returned, without one-to-one assignment.

### Verification results

Working directory: `C:\Users\Caleb Babatunde\Documents\GitHub\spendlens`.
Environment: PowerShell default Python 3.13.15, pytest 8.3.4. All automated
execution below was performed by Luna High; none by the main agent.

| Command / observed check | Result |
| --- | --- |
| `python -m pytest tests/ml/test_reconcile.py tests/ml/test_normalize.py tests/ml/test_contracts.py --tb=short` | Initial run: exit 0; 91 passed, 0 failed, no warnings; 1.04 seconds. |
| Same focused command after readability cleanup | Expanded identity encoding/hash/digest, normalized-word and reference-evidence intermediates; rerun exit 0, 91 passed, 0 failed, no warnings; 2.08 seconds. |
| Read-only SHA-256 of normalized-LF challenge UTF-8 | `9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`; unchanged. |
| Main-agent source and diff inspection | Read all Step 4 source/tests and affected documentation; matching, validation, result metadata, no mutation and layer boundaries agree with the saved plan. No remaining Step 4 findings. |

The main agent independently computed the fixed identity test vector with
PowerShell SHA-256 over the specified JSON bytes before implementing identity
construction; this was fixture preparation, not test execution. No package
installation, generated build directory, report or hosted CI run occurred.
Git continues to warn about access to the sandbox user's global ignore file;
command-local safe.directory permits local inspection without global changes.

### Design critique and UI verification

No UI/server applies. Duplicate and transfer candidates remain independent
review kinds; bank is descriptive metadata and time is not a matching field.
Rule strength is not a calibrated probability. Candidate output can contain
several plausible matches; user/backend confirmation is required and no totals
change. The conservative whole-word transfer vocabulary can miss other transfer
spellings; no unsupported general detection or real-world accuracy is claimed.
No contract, dependency or material plan revision was needed.

### Remaining proof

AC4/AC5 and AC6 candidate behavior have focused Step 4 evidence. AC1 final
installed reconciler/CLI verification, AC8 split evaluation, AC9 report, AC10
CI, AC11 complete regression/handoff evidence and full acceptance review remain
their planned Steps 5–6. No numerical evaluation, full suite, hosted CI or
Python-version matrix was run at Step 4. Python lint/type-check tooling is not
configured. Synthetic accuracy does not establish real-world accuracy.

Verdict: **Approve for Step 4; no remaining Step 4 findings. Stop for owner
`NEXT` before Step 5.**

Final Step 4 documentation inspection: required tracker sections/table columns
preserved; `git diff --check` passed and explicit trailing-whitespace search of
Step 4 sources/tests and updated records (including untracked handoff/tracker)
found no matches. Only Git CRLF/global-ignore environment warnings were observed.
No later step started.

## Step 6 prerequisite audit: 2026-11-13 10:32 WAT

Owner requested the exact Step 6. Reviewer: primary agent self-review using
the review skill; this is a dependency inspection, not a completed full-feature
review or independent approval. Current files and progress were inspected
before relying on earlier evidence. No source, fixtures or governing laws changed.

Priority: Must fix before final verification.
Confidence: 5.
What I found: Step 5 is unimplemented in the current worktree. The paths
`ml/eval/run.py`, `tests/ml/test_eval.py`, `reports/eval_v1.md` and
`.github/workflows/ml-v1.yml` all fail filesystem existence checks.
Why it matters: Step 6 explicitly depends on Steps 1–5 and requires installed
CLI execution, report inspection and a complete AC1–AC11 audit.
Trigger and effect: Attempting final verification now cannot establish the
evaluation/report/CI requirements; passing earlier-step tests cannot fill them.
Where: `ml-v1.md`, Step 6 dependencies and substeps 2–5.
Suggested fix: Obtain the owner's scope decision to implement Step 5 first,
then perform Step 6 against that implementation under the saved checkpoints.

| Acceptance scope | Current evidence and remaining proof | Status |
| --- | --- | --- |
| AC1 | Earlier package/categorizer install proof exists; installed reconciler and CLI final proof missing, CLI source absent. | Pending |
| AC2–AC7 | Earlier Steps 1–4 evidence retained above; complete source audit and fresh final suites have not run. | Final verification pending |
| AC8 | Earlier challenge freeze/provenance evidence exists; separate evaluation sections absent. | Pending |
| AC9 | Evaluator, metric tests and generated report absent. | Not implemented |
| AC10 | Planned workflow absent; no hosted-run evidence inspected. | Not implemented |
| AC11 | Earlier contract/handoff evidence exists; final AI regression suite and provider-free evaluation not run. | Pending |

No test/evaluation commands were run, no dependencies installed and no artifacts
regenerated at this checkpoint. Luna execution has not been attempted; this is
a missing implementation dependency, not a delegation failure. Python lint/type
checking is not configured. UI/server checks are N/A. The command-local Git
safe.directory override permitted inspection; global-ignore permission warnings
persist. Existing untracked context and handoff files were preserved.

Verdict: **Blocked for complete Step 6 approval.** This records a review verdict,
not feature completion. Step 5 implementation is a separate main step under the
saved plan; no silent sequence or scope change was made.


## Step 5 checkpoint: evaluation, CI and local handoff documentation

Date: 2026-11-13 11:03 WAT (Africa/Lagos). Scope: exact Step 5, explicitly authorized
by the owner after the earlier Step 6 prerequisite inspection. That dependency
finding is resolved by this implementation; the earlier inspection is retained
as history and is not a completed Step 6 review. Reviewer: primary agent
self-review; tests/evaluation/package execution by gpt-6-luna at high reasoning.
This is not independent review or full-feature approval.

### Requirement audit

| Requirement | Implementation and observed evidence | Status |
| --- | --- | --- |
| Known-answer metrics before logic | Wrote test_eval.py before evaluator; hand-scored accuracy, per-class precision/recall, abstention, confident errors and pair TP/FP/FN. Final tests also assert rendered nonperfect counts/rates. | Passed |
| Denominators and absent classes | Exact counts and fractions; all-row denominators include correctly predicted Uncategorized. Zero denominators render N/A, never invented perfect scores. | Passed |
| Development-only baseline | Majority of combined generated/fixed development labels; ties use category vocabulary order. Non-tie/tie known answers and challenge-only label perturbation verify baseline isolation. | Passed |
| Split separation and data independence | Three separate sections: generated development, fixed development and frozen challenge. Canonical inputs alone reach detectors; labels stay in scoring. IDs must be unique/aligned; pair scoring includes kind and unordered IDs. | Passed |
| Challenge freeze | Loader checks normalized UTF-8 SHA-256 against the Step 2 freeze; tampering test rejects changes. Production categorizer, reconciler, rules and challenge files unchanged. | Passed |
| CLI/report and local run | Same non-interactive command for developers/CI; exit 0 and actual report inspected. Metadata includes seed, actual counts/spans, fixture digests, package/model versions, commit link and dirty worktree state. No descriptions/raw rows printed. | Passed |
| Report limitations | Synthetic caveat, all applicable metrics, baseline, confident-error/abstention comparison, zero-denominator conventions and V1 forecast N/A. Challenge weakness retained honestly without tuning. | Passed |
| CI setup | Workflow installs package/test extras and existing AI offline dependencies, runs repository tests then evaluation, uploads generated report after success; contents permission read only. Temporary copied-source regular install includes evaluator/rules files. | Passed configuration/package inspection; hosted run pending |
| Local handoff | Callable example, exact typed contracts, metadata, bank distinction, backend confirmation boundary, assets/CLI usage and measured limitations in guide/README. No external message sent. | Passed locally; external recipient confirmation remains pending |

### Changed files and responsibilities

- ml/eval/__init__.py and run.py: fixed offline evaluation and report CLI using
  standard library only; local Git inspection never contacts a remote host.
- tests/ml/test_eval.py: known-answer metrics/baseline/rendering, split and
  challenge integrity, alignment/error behavior and safe commit-link tests.
- reports/eval_v1.md: generated synthetic evidence, including weak challenge
  categorization, baseline comparison and explicit dirty-source provenance.
- .github/workflows/ml-v1.yml: package/dependency setup, offline repository
  tests, evaluation and successful-run report artifact.
- README.md and docs/ml_v1_handoff.md: setup, callable example, developer tooling
  and integration/confirmation boundaries. Evaluation fixtures remain repository
  assets; installed code accepts --fixtures for explicit outside-checkout use.
- Feature plan status, progress, this single review and project tracker: actual
  authorization, measured checkpoint evidence and remaining Step 6/hosted limits.
  Governing laws, existing AI contracts, detectors and unrelated changes preserved.

### Verification results

Working directory: C:\Users\Caleb Babatunde\Documents\GitHub\spendlens.
Environment: Windows PowerShell, Python 3.13.15, pytest 8.3.4, pluggy 1.6.0;
pydantic 2.13.5, httpx 0.28.1, setuptools 80.10.2. All automated checks below
ran through Luna High; no tests/evaluations ran in the main agent.

| Command / observed check | Result |
| --- | --- |
| python -m pytest tests/ml/test_eval.py --tb=short | Final exit 0: 19 passed, 0 failed. Earlier 12- and 14-case focused runs passed before additional integrity/rendering tests. |
| python -m ml.eval.run --out reports/eval_v1.md | Exit 0; generated report inspected after final source changes. Subsequent edits were test/docs only. |
| python -m pip install --no-deps --no-build-isolation --target <temp>/installed <temp>/source | Exit 0. Source is a temporary copy of pyproject.toml and ml/, avoiding root/system changes or dependency downloads. Wheel spendlens_ml-0.1.0 built/installed. RECORD includes ml/eval/__init__.py, ml/eval/run.py and ml/rules/categories.yaml. |
| Default interpreter package/dependency inspection | AI/build dependencies available; spendlens-ml distribution metadata absent in default interpreter. Temporary installation above proves CI package layout; default environment was not modified. |
| Source/report/workflow self-review | No remaining Step 5 defects. CI installation precedes tests requiring distribution metadata; no actual hosted CI result claimed. |

Temporary install evidence: %TEMP%/spendlens-step5-75f9040bddd344be858af2a7dea83d35,
with source and installed subdirectories. This is package contents proof, not
Step 6 clean-environment public runtime/full-suite verification.

| Split | Correct / rows | Abstentions | Confident mistakes | Baseline correct / rows |
| --- | --- | --- | --- | --- |
| Generated development, seed 20261111 | 746/746 | 82/746 | 0 | 82/746 |
| Fixed development | 57/57 | 18/57 | 0 | 18/57 |
| Frozen challenge | 17/57 | 56/57 | 1 | 18/57 |

Candidate precision and recall are 1.000000 for duplicate and internal_transfer
on each synthetic split: generated expected counts 4/2 and fixed/challenge 4/6.
Each persona has 373 generated rows spanning 2026-01-01 through 2026-06-30.
The development-majority category is Uncategorized. Challenge accuracy 0.298246
is below baseline 0.315789; high development scores reflect development vocabulary
and are not evidence of general coverage. No rule or challenge tuning followed.
Synthetic accuracy does not establish real-world accuracy.

Implementation review corrections, all resolved and covered by final tests:
derive fixture case counts instead of hardcoding them; reject nonmapping answer
tables; replace relative commit links with credential-free absolute GitHub links;
assert known baseline/rendered values instead of comparing a helper to itself.
No contract shape, runtime dependency or material plan revision was required.

### Design critique and UI verification

No UI/server applies. The CLI is developer/CI evaluation tooling, not a backend
CSV endpoint. It consumes only synthetic fixtures and uses the same public pure
functions as callers. Unknown Git provenance is explicit when invoked outside a
Git checkout; this run records source commit
373f777a68d0c729252503cdcd1f09f2fbbc2711 and dirty worktree state. Git origin is
read locally only to build a sanitized source link. Reasons/candidates never
change totals, and AI receives only its existing validated aggregate contract.

### Remaining proof

AC8 split evidence and AC9 report have Step 5 local proof. AC10 configuration
is implemented; a hosted run needs authorized publication/execution and is not
claimed. AC11 local integration guidance is updated; complete AI regressions
remain Step 6. AC1 installed public-function/CLI runtime and the complete AC1–AC11
review remain Step 6, along with full ML/repository suites and ai.eval --fake.
No Python lint/type checker is configured. No live provider, external handoff,
publication, V2 implementation or full Step 6 audit occurred.

Verdict: **Approve for Step 5 with the explicit hosted-CI limitation.** Stop for
owner NEXT before Step 6; this does not mark the complete V1 feature verified.


Final Step 5 documentation check: git diff --check passed; explicit trailing-space
search across new/updated ML evaluator, tests, workflow, report and documentation
found no matches (rg exit 1 means no matches). Tracker headings, columns and
section order preserved; new completed-work/verification rows remain inside their
existing tables. Only Git CRLF/global-ignore environment warnings were observed.
No source or test changes followed the final 19-pass run.


## Step 6 integration finding and resolution in progress

Date: 2026-11-13 12:32 WAT (Africa/Lagos). Owner authorized Step 6 with NEXT and
subsequently excluded GitHub execution/checks. Main agent self-review; all
execution through delegated Luna High. No hosted runs were initiated.

Priority: Must fix.
Confidence: 5.
What I found: The full repository suite could not collect both evaluation test
modules because tests/test_eval.py and tests/ml/test_eval.py were imported as
the same unqualified test_eval module.
Why it matters: The required repository regression suite and configured CI
command stopped before executing tests; focused ML success did not prove the
combined test surface worked.
Trigger and effect: python -m pytest tests collected 238 items then exited 2
with one import-file-mismatch collection error.
Where: tests/test_eval.py:1 and tests/ml/test_eval.py:1; neither tests directory
had an __init__.py package marker.
Suggested fix: Add tests/__init__.py and tests/ml/__init__.py so pytest imports
tests.test_eval and tests.ml.test_eval separately, without renaming the planned
test file, changing pytest configuration or altering production code.

Implementation fix applied: both package markers added. Focused ML rerun passed
152 tests, exit 0; the affected full repository rerun is still pending here.
No new automated test is needed to mirror the markers: the previously failing
full-suite collection is the direct regression check. Installed production code
is unaffected, so its successful 22-assertion outside-checkout smoke does not
need repetition. Provider-free AI evaluation already passed 20/20 and its
existing report was preserved byte-for-byte. Final acceptance audit follows
once the remaining local checks complete.


## Step 6 checkpoint: complete review and final local verification

Date: 2026-11-13 12:38 WAT (Africa/Lagos). Owner authorized Step 6 with NEXT, then
explicitly excluded GitHub execution/checks. Scope: complete ML V1 implementation
and AC1–AC11, including Steps 1–5 and the two test-package marker fixes.
Reviewer: primary-agent self-review using the review skill; test/runtime execution
by delegated gpt-6-luna at high reasoning. This is not independent code review.
Earlier dated findings and reruns remain intact above.

### Requirement audit

| Criterion | Source and observed evidence | Result |
| --- | --- | --- |
| AC1: install/import/resources/CLI | Clean noneditable install of a temporary copy of current pyproject.toml and ml/. Outside-checkout Python -I smoke verified ml, categorizer, reconciler and evaluator under venv site-packages, rules resource and installed CLI. RECORD contains only ml and distribution metadata. | Passed locally |
| AC2: canonical frozen contract | types.py and contract tests cover exact fields, required normalized bank, positive integer kobo (reject bool/float/string), date/time rules, frozen results, safe field-only errors and unique call IDs. Standard-library imports only; no backend/network coupling. | Passed |
| AC3: categorization | categorize.py, normalize.py and packaged JSON-compatible rules implement exact vocabulary, whole-word/phrase support, ordered cardinality and 0.9/0.0 policy. Tests cover ambiguity, boundaries, metadata independence, seeds and no mutation; installed smoke verifies observable outputs. | Passed |
| AC4: duplicates | reconcile.py and exact tests cover account/direction/amount/date/normalized-description matching, complete reference matrix and legitimate repeated purchases. Every qualifying pair remains a candidate; no deletion/totals mutation. | Passed |
| AC5: internal transfers | Tests pin equal opposite amounts, distinct accounts, both date orders at +/-1 day and +/-2 rejection, either-side clue, fees without netting, missing counterparts, no-clue and refund negatives. | Passed |
| AC6: IDs/metadata/reasons | Frozen types and SHA-256 identity recipe, precomputed digest, all-pair expected results, 24 permutations, stable kind/ID order, confidence/method/version and description-free review reasons. Installed reversal smoke also passed. | Passed |
| AC7: generator and labels | synthetic.py and tests verify deterministic private RNG, 746 rows, 373 per persona, all 181 dates January–June, seeds 20261111/7, complete separate labels, edge injections and exhaustive pair truth. | Passed |
| AC8: challenge independence | Fixture provenance/authorship precedes rules; normalized challenge digest remains frozen. Distinct descriptions and independent answer tables verified; evaluator presents separate development/challenge sections and isolates baseline fitting. No rules or challenge answers changed after evaluation. | Passed |
| AC9: report correctness | Known-answer metric/baseline/rendering tests passed in complete suites. Final CLI exit 0; actual report inspected for seed, counts/spans, class metrics, abstentions, confident mistakes, pair metrics, baseline, versions, commit/dirty state, N/A forecast metrics and synthetic caveat. | Passed |
| AC10: CI configuration | Workflow installs the package and offline test dependencies, runs repository tests/evaluation and retains successful report artifact; no invented numerical ML gate. Package installation and those commands have local proof. Owner explicitly excluded GitHub execution/checks. | Configuration reviewed; hosted execution excluded, not claimed |
| AC11: existing AI and handoff | Full repository suite 260 passed; provider-free AI evaluation 20/20. Existing AI contracts/implementation unchanged, fake artifact restored byte-for-byte. Guide documents callable examples, bank/category separation, metadata, candidate confirmation and measured limits. No external handoff performed. | Passed locally |

### Changed files and responsibilities

- tests/__init__.py and tests/ml/__init__.py: give AI and ML tests distinct
  qualified module names; resolve the combined-suite collection failure without
  renaming planned tests, changing pytest settings or touching production logic.
- reports/eval_v1.md: regenerated through the exact final command; fixed metrics
  and source provenance inspected. Source remains dirty and is disclosed.
- docs/ml_v1_handoff.md: replace pending installed-verification wording and record
  actual local verification, environment, test fix and remaining limits.
- Feature plan status, progress, this single review and project tracker: final
  evidence, AC mapping, finding resolution and owner-excluded GitHub execution.
  Governing laws, production ML/AI code, rules, fixed data and unrelated worktree
  files were preserved. No source change required a contract/architecture update.

### Verification results

Repository working directory: C:/Users/Caleb Babatunde/Documents/GitHub/spendlens.
Verification root (T below):
C:/Users/Caleb Babatunde/AppData/Local/Temp/spendlens-step6-2e3bc0a1dfcc42ad9ca298a9115429fc.
P below is T/venv/Scripts/python.exe; S is T/source, containing copied
pyproject.toml and ml/. Clean venv has no system-site-packages. Python 3.13.15,
pip 26.2.1, pytest 9.2.0, pydantic 2.14.3, httpx 0.28.1.
Every test/evaluation command was executed by Luna High, never the main agent.

| Effective command / observed check | CWD | Result |
| --- | --- | --- |
| python -m venv T/venv | Repository | Clean environment created; no system installation changed. |
| & P -m pip install --disable-pip-version-check --timeout 60 S 'pytest>=7' 'pydantic>=2,<3' 'httpx>=0.27,<1' | Repository; build source is S | Final exit 0; regular spendlens-ml 0.1.0 installed. Initial sandbox WinError 10013 required scoped escalation; an initial escalated dependency attempt timed out, then completed with the recorded timeout. |
| & P -I T/installed_smoke.py, with PYTHONPATH unset | T, outside checkout | Exit 0; 22 assertions. Modules resolved from site-packages; only optional pytest extra appears in metadata, no runtime dependencies. RECORD and packaged rules inspected. Temporary harness import-alias/optional-extra assumptions were corrected before the successful smoke; repository production code was unchanged. |
| & P -I -m ml.eval.run --fixtures C:/Users/Caleb Babatunde/Documents/GitHub/spendlens/tests/ml/fixtures --out T/installed_eval.md | T | Exit 0; actual installed CLI report has 746/57/57 rows and caveat. Source metadata is explicitly unavailable/unknown outside Git. |
| & P -m pytest tests/ml | Repository | Initial exit 0, 152 passed (10.09s); after package-marker fix, exit 0, 152 passed (29.20s). |
| & P -m pytest tests | Repository | Initial exit 2: 238 collected and one import-file-mismatch error, no tests executed. After marker fix, exit 0: 260 passed in 43.41s; tests.ml.test_eval and tests.test_eval collect separately. |
| & P -m ai.eval --fake | Repository | Exit 0; 20/20 pass; fallback/check-fail/error/retry all zero. p50 1.430ms and p95 3.938ms measure local harness execution, not model latency. No repeat needed after test-only markers. |
| & P -m ml.eval.run --out reports/eval_v1.md | Repository | Final exit 0; actual report inspected. Source commit 373f777a68d0c729252503cdcd1f09f2fbbc2711; dirty worktree disclosed. |

Evidence under T: installed_smoke.py, installed_smoke_output.json,
installed_eval.md, eval_fake_generated.json and ai_fake_output.txt. Existing
docs/eval_fake.json was snapshotted/restored; before/after SHA-256:
763061061E08F6F1440A2FD6B88F86C2B0C1A22778D7869EC98DAEA87DC4BE1C.
No unrelated generated artifact was retained as a new change.

Source review covered all ML modules, packaging, rules, tests, fixture provenance
and representative data, CLI/report, workflow and handoff, plus existing AI
boundary/verification setup. Local branch ml-logic has HEAD 373f777; verified
cached origin/HEAD targets origin/main (f6d6586), merge base 7880b00. Contract
implementation already on that base was included in the full review, alongside
later committed steps and uncommitted Step 5/6 files. No fetch/push/merge occurred.

Before the owner's exclusion, the read-only GitHub connector returned zero runs
for HEAD within its first-page PR-triggered scope. That limited query was not
proof of all triggers or of this uncommitted workflow. No further GitHub checks,
runs, publication or messages occurred after the owner's instruction; hosted
execution is excluded from this checkpoint, not represented as passing.

### Design critique and UI verification

The sole Must fix finding was the combined test-collection collision, recorded
above and now resolved with directly observed full-suite success. No unresolved
Must fix or Should fix findings remain. Public functions stay pure, typed and
review-only; metadata does not supply category evidence and no candidate changes
totals. AI retains validated aggregates only. No database/API/UI/billing work,
forecast/recurrence implementation or new runtime dependency was introduced.
UI/server/device checks are N/A for this pure package.

Synthetic measurements remain: generated development 746/746 correct,
82 abstentions; fixed development 57/57 correct, 18 abstentions; challenge
17/57 correct (0.298246), 56 abstentions and one confident mistake, below the
majority baseline 18/57 (0.315789). Duplicate/transfer precision and recall are
1.000000 in these synthetic splits, with expected pair counts 4/2 generated and
4/6 in each fixed split. The high development scores do not establish general
coverage. No rule or challenge tuning followed the results.

### Remaining proof

GitHub execution/checks were excluded by the owner. External recipient
confirmation/handoff and Python versions/platforms beyond Windows/Python 3.13
were not verified; none is claimed. Python lint/type-check tooling is not
configured, so no passing result is invented. No live provider evaluation was
needed or run. Dirty-source provenance and synthetic limitations are explicit.
These are recorded limits, not unfinished local Step 6 checks.

Verdict: **Approve for the local ML V1 implementation with the recorded limits.**
Step 6 is complete locally. Stop at the final NEXT checkpoint; do not start V2.


Final Step 6 documentation verification: git diff --check passed after recording
results; tracker headings, columns and order retained. pyvenv.cfg directly
confirms include-system-site-packages=false, and the main-agent read-only SHA-256
check confirms the original fake report hash above after all local checks. The
source/report evidence was inspected rather than inferred from passing counts.
No source/test changes followed the successful final suites; only documentation
was updated. Stop at the final checkpoint.

## Owner-directed bank-source correction — 2026-11-13 13:08:43 Africa/Lagos

Scope: `ml/types.py`, `pyproject.toml`, `tests/ml/test_package.py` and the related
bank-source documentation. This is a self-review, not independent review.

The earlier ML registry was derived from its own literal list. It now reads
institution values directly from `ai.banks.BANKS`, deduplicates in source order
and includes `other`. All aliases and the fallback remain owned by
`ai/banks.py`; callers still normalize with `ai.banks.normalize_bank`.
The literal `Bank` remains the frozen typing contract; the compatibility test
requires it to match the authoritative registry. Only this dependency-free module
and the empty AI initializer are included alongside ML in the distribution.
No AI service imports, runtime dependency, network operation or candidate/category
behavior change was introduced. The owner explicitly requested this source and
related documentation correction, including the narrow architecture clarification.

Luna High verification, Python 3.13.15 / pytest 8.3.4, repository root unless noted:

- `python -m pip install . --no-deps --no-build-isolation --target $target`:
  exit 0. Target is `C:/Users/Caleb Babatunde/AppData/Local/Temp/spendlens-bank-verify-target`.
  Installed contents include `ai/banks.py` and empty `ai/__init__.py`, exclude
  `ai/api.py`, `ai/schemas.py`, providers and all other AI service modules.
- With `PYTHONPATH=$target`, `python -m pytest tests/ml/test_contracts.py tests/ml/test_package.py --tb=short`:
  exit 0, 48 passed. Final focused rerun followed the formatting-only source edit.
- With `PYTHONPATH=$target`, `python -m pytest tests --tb=short`:
  exit 0, 261 passed. This run preceded only the final vertical-formatting edit;
  the focused rerun covered that edit afterward.
- Copied `tests/ml/test_package.py`, from temporary outside-checkout working directory
  `C:/Users/Caleb Babatunde/AppData/Local/Temp/spendlens-bank-verify-isolated`,
  with `PYTHONPATH=$target`, `python -m pytest tests/ml/test_package.py --tb=short`:
  exit 0, 4 passed.

The initial focused run had 47 passed and one missing-distribution-metadata failure;
the base environment had not installed `spendlens-ml`. The isolated installation
resolved it. An early full-suite attempt was stopped to satisfy that prerequisite;
no result is claimed for that attempt. No live provider or hosted GitHub checks
were run. Existing unrelated worktree changes were preserved.

No unresolved findings in this correction. Verdict: **Approve**, with the existing
V1 synthetic-coverage and platform limitations retained. This correction does not
claim new model-performance evidence or authorize V2.

## Registry-only bank typing correction — 2026-11-13 17:43:35 Africa/Lagos

Owner clarification supersedes the earlier bank-literal compatibility decision:
`ai.banks.BANKS` is the sole source of bank names and aliases. No `Bank` literal
is maintained in AI or ML. `Bank = str` preserves the public ML import name;
`Txn.bank` is validated against the registry-derived institution values plus
`other`. The undefined-name error occurred because `Txn.bank` referenced `Bank`
without a definition or import. The string alias resolves that error without
introducing another bank-name list. AI normalization remains unchanged.

Luna High, Python 3.13.15 / pytest 8.3.4, repository root:
`python -m pytest tests/ml/test_contracts.py tests/ml/test_package.py --tb=short`
passed 48 tests, exit 0; `python -m pytest tests --tb=short` passed 261 tests,
exit 0. `PYTHONPATH` pointed to the previously installed temporary metadata target
`C:/Users/Caleb Babatunde/AppData/Local/Temp/spendlens-bank-verify-target`;
`ml.__file__` confirmed source resolution from the current checkout. The initial
focused run without installed metadata had 47 passed and one metadata failure;
using the existing target resolved the environment prerequisite. No fresh
installation or hosted/live-provider check was performed. Current docs and the
registry regression assertion reflect string typing without a bank literal.

Self-review: no unresolved findings for this correction; no V2 work authorized.

## Direct bank string annotation — 2026-11-13 17:48:12 Africa/Lagos

Owner requested removal of the unnecessary `Bank = str` indirection.
`Txn.bank` now uses `str` directly; the alias and its public export were removed.
This supersedes earlier compatibility-alias guidance. Bank-name validation still
uses values derived only from `ai.banks.BANKS` plus `other`; no behavior or bank
registry changed. Active plan, architecture, standards and handoff docs agree.

Luna High ran `python -m pytest tests/ml/test_contracts.py tests/ml/test_package.py --tb=short`
from the repository root with the existing temporary install target on `PYTHONPATH`
for distribution metadata: exit 0, 48 passed, 0 failed, Python 3.13.15 / pytest 8.3.4.
Only focused checks were needed for this annotation/export simplification;
no new full-suite or installed-package result is claimed. Diff whitespace check
passed. Self-review found no remaining alias references in ML source or active
contract docs. No V2 work started.
