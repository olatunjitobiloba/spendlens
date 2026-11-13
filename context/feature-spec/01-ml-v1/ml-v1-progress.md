# ML V1: Progress

Links: [plan](ml-v1.md), [single review record](review.md),
[project tracker](../../progress-tracker.md).

## Current checkpoint

- Main step: 4, duplicate and internal-transfer candidates, complete at this checkpoint.
- Status: public reconciler, stable pair IDs/order, exact confidence/evidence and input safety verified. Luna High: 91 passed, exit 0; challenge hash unchanged.
- Waiting for: owner `NEXT` to authorize Step 5 only.

## Step log

| Step | Substeps completed | Files changed | Checks and results | Local run evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Planning | Read governing context, source plan, starter outline, manifests and existing AI boundary; scoped V1; recorded owner-confirmed field agreement. | Feature plan, progress, review and project tracker. | Manual document/source comparison; no application tests needed for planning. | N/A, no runtime changes. | Draft ready for owner review. |
| 1: Package/contracts | Reviewed concrete schemas, validation and ID rules; wrote expectations before frozen types; added owner-required `bank`; configured explicit packaging and handoff setup. | pyproject.toml; ml/__init__.py; ml/types.py; tests/ml/test_contracts.py; tests/ml/test_package.py; docs/ml_v1_handoff.md; owner-directed plan/context updates; feature/tracker records. | Luna High: focused suite 46 passed, 0 failed/skipped; copied suite outside checkout 46 passed, 0 failed/skipped. Both exit 0. Smoke assertions passed. Pytest cache-write warning on each run. | Editable and regular isolated installs; regular package imported from its site-packages outside checkout, version 0.1.0, only ML distribution files. Initial sandbox PyPI failure resolved via scoped escalation. | Complete; waiting for `NEXT`. |
| 2: Labeled data | Exact category/pair answers, independent challenge wording/freeze, seeded personas, separate labels, manifest and exhaustive pair/data checks. | ml/synthetic.py; tests/ml/fixtures/development.json; tests/ml/fixtures/challenge.json; tests/ml/test_synthetic.py; feature status/progress/review and tracker. | Luna High: `python -m pytest tests/ml/test_synthetic.py tests/ml/test_contracts.py`, exit 0, 54 passed, 0 failed, no warnings. Earlier failures and fixes preserved in review. | Generator exercised for seeds 20261111 and 7; 746 rows, 373 per persona, every date 2026-01-01–2026-06-30; six candidate labels. Each fixed split: 23 cases, 57 rows, 10 pair labels. | Complete; waiting for `NEXT`. |
| 3: Categorization | Pinned boundary expectations before logic; implemented complete-word/phrase rules, unique-category support and abstention; verified ordered metadata, validation, nonmutation and resource packaging. | ml/normalize.py; ml/categorize.py; ml/rules/categories.yaml; ml/__init__.py; pyproject.toml comment; tests/ml/test_normalize.py; tests/ml/test_categorize.py; tests/ml/test_package.py; handoff and tracking records. | Luna High: focused and copied outside-checkout suites each exit 0, 41 passed. Initial pre-install run: 40 passed, installed-distribution check failed; resolved by regular installation. | Python 3.13.15 regular install exit 0; public categorizer and rule resource resolve from venv site-packages; smoke and unchanged challenge hash passed. | Complete; waiting for `NEXT`. |
| 4: Reconciliation | Wrote pair expectations before logic; implemented all eligible duplicate/transfer pairs, frozen identity recipe, stable ordering, privacy-safe reasons and no mutations. | ml/reconcile.py; ml/__init__.py; tests/ml/test_reconcile.py; handoff and feature/tracker records. | Luna High: `python -m pytest tests/ml/test_reconcile.py tests/ml/test_normalize.py tests/ml/test_contracts.py --tb=short`, exit 0, 91 passed, 0 failed, no warnings; challenge hash unchanged. | Development cases separately and combined, generated seeds 20261111 and 7, 24 input permutations and invalid-call checks exercised through delegated tests; no server. | Complete; waiting for `NEXT`. |
| 5: Evaluation/CI/handoff docs | None. | None. | Not run; implementation pending. | None. | Pending. |
| 6: Full review/verification | None. | None. | Not run; implementation pending. | None. | Pending. |

## Review findings and fixes

- Initial planning review is in [review.md](review.md); it approves only the
  documented scope with pending implementation/contract-shape evidence.
- Owner confirmed team agreement for result `model_version` and candidate
  `method` on 2026-11-05. Exact output shapes were reviewed in Step 1 and recorded in the handoff contract.
- Owner selected the shorter `ml` package name and `python -m ml.eval.run`
  command; source plan, architecture, code standards and feature records now agree.

## Blockers and remaining limitations

- Steps 1–4 contracts, packaging, labeled data, categorization and reconciliation are implemented; measured ML evaluation remains pending. The planned `python -m ml.eval.run --out reports/eval_v1.md` command will generate the fixed synthetic evaluation report for local review and CI.
- Concrete result schemas and validation, including required `Txn.bank`, are recorded in the handoff contract and verified by Step 1 tests.
- Confirm current backend/AI recipients before any externally authorized handoff.
- Hosted CI execution requires authorized publication; a workflow file alone is
  not CI run evidence.
- Initial `git status` hit ownership protection; a command-local safe.directory
  override enabled read-only inspection. No global Git configuration changed.
- Existing `.gitignore` changes and untracked instruction/context documents were
  present before this task and must be preserved.

## Final verification

- Documentation inspection: Steps 1–4 reviewed against ML_PLAN.md and the saved plan; dated self-reviews and challenge freeze evidence are retained in review.md.
- Tests/runtime: Step 4 focused delegated suite passed 91 tests, exit 0, no warnings. Prior installation/resource evidence and environment limits remain in the dated Step 1/3 records. No Step 4 server/UI run applies; installed reconciler and full-feature verification remain Step 6.
- Acceptance criteria status: AC3 retains Step 3 proof; AC4/AC5 duplicate and transfer behavior and AC6 candidate identity/metadata now have Step 4 focused proof. AC1 awaits installed reconciler/CLI checks; AC2 and AC7 retain prior proof. Evaluation, CI and complete acceptance review remain pending.




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
