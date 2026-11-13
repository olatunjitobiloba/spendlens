# ML V1: Progress

Links: [plan](ml-v1.md), [single review record](review.md),
[project tracker](../../progress-tracker.md).

## Current checkpoint

- Main step: 6, complete review and final verification, complete locally after owner NEXT.
- Status: Luna High verified a clean regular install, 22 outside-checkout smoke assertions, 152 ML tests, 260 repository tests, 20/20 fake AI cases and the regenerated ML report. The test import collision is resolved.
- Waiting for: final owner review at the required NEXT checkpoint. GitHub execution/checks were excluded by the owner; no V2 work started.

## Step log

| Step | Substeps completed | Files changed | Checks and results | Local run evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Planning | Read governing context, source plan, starter outline, manifests and existing AI boundary; scoped V1; recorded owner-confirmed field agreement. | Feature plan, progress, review and project tracker. | Manual document/source comparison; no application tests needed for planning. | N/A, no runtime changes. | Draft ready for owner review. |
| 1: Package/contracts | Reviewed concrete schemas, validation and ID rules; wrote expectations before frozen types; added owner-required `bank`; configured explicit packaging and handoff setup. | pyproject.toml; ml/__init__.py; ml/types.py; tests/ml/test_contracts.py; tests/ml/test_package.py; docs/ml_v1_handoff.md; owner-directed plan/context updates; feature/tracker records. | Luna High: focused suite 46 passed, 0 failed/skipped; copied suite outside checkout 46 passed, 0 failed/skipped. Both exit 0. Smoke assertions passed. Pytest cache-write warning on each run. | Editable and regular isolated installs; regular package imported from its site-packages outside checkout, version 0.1.0, only ML distribution files. Initial sandbox PyPI failure resolved via scoped escalation. | Complete; waiting for `NEXT`. |
| 2: Labeled data | Exact category/pair answers, independent challenge wording/freeze, seeded personas, separate labels, manifest and exhaustive pair/data checks. | ml/synthetic.py; tests/ml/fixtures/development.json; tests/ml/fixtures/challenge.json; tests/ml/test_synthetic.py; feature status/progress/review and tracker. | Luna High: `python -m pytest tests/ml/test_synthetic.py tests/ml/test_contracts.py`, exit 0, 54 passed, 0 failed, no warnings. Earlier failures and fixes preserved in review. | Generator exercised for seeds 20261111 and 7; 746 rows, 373 per persona, every date 2026-01-01–2026-06-30; six candidate labels. Each fixed split: 23 cases, 57 rows, 10 pair labels. | Complete; waiting for `NEXT`. |
| 3: Categorization | Pinned boundary expectations before logic; implemented complete-word/phrase rules, unique-category support and abstention; verified ordered metadata, validation, nonmutation and resource packaging. | ml/normalize.py; ml/categorize.py; ml/rules/categories.yaml; ml/__init__.py; pyproject.toml comment; tests/ml/test_normalize.py; tests/ml/test_categorize.py; tests/ml/test_package.py; handoff and tracking records. | Luna High: focused and copied outside-checkout suites each exit 0, 41 passed. Initial pre-install run: 40 passed, installed-distribution check failed; resolved by regular installation. | Python 3.13.15 regular install exit 0; public categorizer and rule resource resolve from venv site-packages; smoke and unchanged challenge hash passed. | Complete; waiting for `NEXT`. |
| 4: Reconciliation | Wrote pair expectations before logic; implemented all eligible duplicate/transfer pairs, frozen identity recipe, stable ordering, privacy-safe reasons and no mutations. | ml/reconcile.py; ml/__init__.py; tests/ml/test_reconcile.py; handoff and feature/tracker records. | Luna High: `python -m pytest tests/ml/test_reconcile.py tests/ml/test_normalize.py tests/ml/test_contracts.py --tb=short`, exit 0, 91 passed, 0 failed, no warnings; challenge hash unchanged. | Development cases separately and combined, generated seeds 20261111 and 7, 24 input permutations and invalid-call checks exercised through delegated tests; no server. | Complete; waiting for `NEXT`. |
| 5: Evaluation/CI/handoff docs | Fixed evaluation, separate split metrics, development-majority baseline, integrity tests, CI and callable integration guide. | ml/eval; tests/ml/test_eval.py; reports/eval_v1.md; .github/workflows/ml-v1.yml; README; handoff and tracking records. | Luna High: focused suite 19 passed, 0 failed, exit 0; CLI exit 0; temporary regular install exit 0 with evaluator/rules in RECORD. | Generated report inspected: 746 generated development rows and 57 rows per fixed split; challenge 17/57 correct, 56 abstentions, one confident mistake. | Complete locally; hosted CI pending; stop for NEXT. |
| 6: Full review/verification | Audited AC1–AC11, verified clean installed runtime, fixed combined-suite collection with test package markers, ran final checks and documented limits. | tests/__init__.py; tests/ml/__init__.py; report; handoff and feature/tracker records. | Luna High: 152 ML and 260 repository tests passed; fake AI 20/20; report CLI exit 0. Earlier full-suite collection error resolved and rerun evidence retained in review. | Clean noneditable install; 22 assertions and installed CLI outside checkout passed; distribution/rules inspected. | Complete locally; final checkpoint; GitHub execution excluded by owner. |

## Review findings and fixes

- Initial planning review is in [review.md](review.md); it approves only the
  documented scope with pending implementation/contract-shape evidence.
- Owner confirmed team agreement for result `model_version` and candidate
  `method` on 2026-11-05. Exact output shapes were reviewed in Step 1 and recorded in the handoff contract.
- Owner selected the shorter `ml` package name and `python -m ml.eval.run`
  command; source plan, architecture, code standards and feature records now agree.

## Blockers and remaining limitations

- Steps 1–6 have local checkpoint evidence. Challenge categorization remains below its majority baseline (17/57 versus 18/57); this measured limitation was retained without changing rules or challenge answers.
- Concrete result schemas and validation, including required `Txn.bank`, are recorded in the handoff contract and verified by Step 1 tests.
- Confirm current backend/AI recipients before any externally authorized handoff.
- Owner excluded GitHub execution/checks from this checkpoint. The workflow remains configuration only; no hosted success is claimed.
- Initial `git status` hit ownership protection; a command-local safe.directory
  override enabled read-only inspection. No global Git configuration changed.
- Existing `.gitignore` changes and untracked instruction/context documents were
  present before this task and must be preserved.

## Final verification

- Complete self-review mapped AC1–AC11 to source, tests, report, installed runtime and local handoff evidence in [review.md](review.md). No unresolved Must fix or Should fix finding remains; reviewer independence is not claimed.
- Luna High clean environment: Python 3.13.15, pytest 9.2.0, pydantic 2.14.3, httpx 0.28.1. Regular installation and outside-checkout smoke passed 22 assertions, including module paths, packaged rules, both public functions and installed CLI.
- Final commands: `python -m pytest tests/ml` passed 152; `python -m pytest tests` passed 260; `python -m ai.eval --fake` passed 20/20; `python -m ml.eval.run --out reports/eval_v1.md` exited 0. All ran through Luna High; no test/evaluation ran in the main agent.
- Full-suite collection initially failed on duplicate test_eval module names. Added tests/__init__.py and tests/ml/__init__.py, then reran affected suites successfully. No production logic or pytest configuration changed.
- Existing docs/eval_fake.json was restored byte-for-byte; fresh fake-run evidence is retained in the temporary verification directory. The final ML report discloses its dirty source worktree and synthetic-only scope.
- AC1–AC9 and AC11 have local proof. AC10 workflow configuration is reviewed; GitHub execution/checks were excluded by the owner and no hosted result is claimed. External handoff was not performed. Python versions/platforms beyond Windows/Python 3.13 were not exercised; no Python lint/type checker is configured. UI/server checks are N/A.
- Local Step 6 complete; final checkpoint reached. Do not start V2 automatically.

## Step 2 verification and provenance

Owner explicitly requested Step 2 on 2026-11-11. Luna High ran the required
focused generator/contract suite under Python 3.13.15 / pytest 8.3.4: final exit
0, 54 passed, no failures or warnings. This exercises the required local run.
Initial failures exposed unrecorded cross-persona pairs, a newline-sensitive
hash and one shared challenge description; all were repaired before rule work
and the affected suite rerun. See the single review record for full history.

The generator manifest derives row counts/dates from actual inputs and records
the seed and synthetic caveat. Default seed is 20261111; alternate test seed is
7. Fixed fixtures have separately authored expected answers and no seed. The
challenge shares the boundary matrix, with distinct descriptions and no generator
or rule dependency. Its normalized UTF-8 SHA-256 is
`9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`.
Do not tune later rules against challenge failures. AC7 is verified; AC8 has
provenance/freeze evidence but awaits separate evaluation sections in Step 5.
Synthetic accuracy does not establish real-world accuracy. Full-feature review
and tests remain Step 6; no later main step was started.

## Step 3 verification

Owner explicitly requested Step 3 on 2026-11-13. Luna High ran
`python -m pytest tests/ml/test_normalize.py tests/ml/test_categorize.py tests/ml/test_package.py --tb=no`
using an isolated regular-install environment: exit 0, 41 passed. The same
three copied test modules and development fixture passed outside checkout:
41 passed, exit 0. Installed categorization/resource smoke assertions passed.
The first pre-install run had 40 passes and one installed-distribution failure;
installation resolved the setup issue. See review.md for exact paths and commands.

Normalization follows the existing development oracle: lowercase, replace
characters other than ASCII letters or whitespace with spaces, then collapse
whitespace. Boundaries split tokens rather than joining them. Rules use exact
words/contiguous phrases; repeated support for one category yields 0.9, absent
or conflicting support yields Uncategorized at 0.0. Bank and other metadata
supply no category evidence. Tests exercise both development seeds, 20261111
and 7, with reversed input order and unchanged inputs.

Challenge content/hash is unchanged and no challenge answers guided rules.
AC3 is verified; challenge metrics remain Step 5. Python versions other than
3.13 were not exercised; the isolated venv reused system test/build tooling.
No lint/type checker is configured. Full-suite, CI and complete-feature review
remain later steps. Synthetic accuracy does not establish real-world accuracy.

## Step 4 verification

Owner explicitly requested the exact Step 4 on 2026-11-13. Luna High ran
`python -m pytest tests/ml/test_reconcile.py tests/ml/test_normalize.py tests/ml/test_contracts.py --tb=short`
from the repository root under Python 3.13.15 / pytest 8.3.4: exit 0,
91 passed, 0 failed, no warnings (1.04 seconds). After readability-only
intermediate-variable cleanup, Luna reran the same command: exit 0, 91 passed,
0 failed, no warnings (2.08 seconds). This supplies the required local fixture
execution. No tests ran in the main agent.

Tests cover the duplicate reference matrix, required-field mismatches,
normalization, legitimate identical purchases, transfer dates from -2 to +2
days with the clue on either side, exact amount/account/direction boundaries,
fees without netting, absent counterparts, no-clue/refund negatives, multiple
eligible pairs, 24 input permutations, unchanged inputs, metadata and the
frozen SHA-256 identity recipe. All 23 development cases are checked both
individually and combined; both generated seeds are checked against separate
candidate labels with reversed-input determinism. The complete normalized word
`transfer` is the clue pinned by existing development expectations; bank,
time and transfer reference values are not matching evidence.

The challenge normalized-LF UTF-8 SHA-256 remains
`9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`.
No challenge evaluation or tuning occurred. Main-agent self-review found no
remaining Step 4 defects; full-feature review remains Step 6. No dependency,
contract shape or governing-law change was needed. Steps 5–6 remain pending;
no real-world performance claim is made.


## Step 5 verification

Owner explicitly authorized Step 5 first on 2026-11-13 after the recorded
Step 6 prerequisite inspection. Luna High performed all test/evaluation
execution. Final focused command `python -m pytest tests/ml/test_eval.py --tb=short`
exited 0: 19 passed, 0 failed. CLI `python -m ml.eval.run --out reports/eval_v1.md`
exited 0. See the single review record for exact environment and package evidence.

Generated development: 746/746 correct, 82 abstentions, zero confident mistakes.
Fixed development: 57/57 correct, 18 abstentions, zero confident mistakes.
Challenge: 17/57 correct, 56 abstentions, one confident mistake; majority baseline
is 18/57. Candidate precision/recall are 1.0 for duplicate and internal_transfer
on each synthetic split. These measurements do not establish real-world accuracy.
The weak challenge categorization result is retained without revising rules or
challenge answers. Forecast metrics are N/A for V1.

Metric/report integrity checks cover explicit denominators, zero-support N/A,
class counts, pair matching by kind, duplicate predictions, split separation,
challenge freeze and baseline isolation, report rendering, CLI errors and
credential-free commit links. Git provenance discloses the dirty worktree.
Runtime dependencies remain standard-library only. The CLI uses repository
synthetic fixtures, with --fixtures for outside-checkout invocation.

The CI workflow installs the package plus existing offline AI test dependencies,
runs repository tests and the same evaluation command, and retains the report.
Hosted execution requires an authorized push/run and is not claimed. No team
messages or external handoff occurred. Step 6 complete review, full suites,
provider-free AI evaluation and clean-environment runtime verification remain
pending. Stop at the Step 5 NEXT checkpoint.


## Step 6 final checkpoint

Owner NEXT authorized the complete final audit. Local verification passed after
resolving the combined AI/ML test collection collision with two package markers.
The single review contains the dated finding, resolution, effective commands,
environment, AC1–AC11 mapping and remaining limitations. The implementation is
locally verified, not a real-world accuracy or hosted-CI claim. Owner explicitly
excluded GitHub execution/checks. No team messages, publication or V2 work occurred.

## Owner-directed bank-source correction — 2026-11-13 13:08:43 Africa/Lagos

`ml.BANKS` now derives normalized institution values from `ai.banks.BANKS`,
preserving registry order and adding the `other` fallback. Alias normalization
continues to use `ai.banks.normalize_bank` at the integration boundary. The frozen
`Bank` typing contract is checked for registry compatibility. The ML distribution
ships only the dependency-free bank module and empty AI initializer, without AI
service modules. No categorization/reconciliation behavior changed.

Luna High: focused contract/package suite 48 passed; complete repository suite
261 passed; copied package suite outside checkout 4 passed; regular target
installation succeeded. Full suite preceded the final formatting-only expansion;
focused suite was rerun afterward. Initial missing-distribution metadata failure
resolved by installing the package into an isolated target. See the dated review
entry for exact commands and environment. Owner-requested correction complete;
no V2 implementation or hosted checks were started.

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
