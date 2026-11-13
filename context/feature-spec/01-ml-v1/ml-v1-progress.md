# ML V1: Progress

Links: [plan](ml-v1.md), [single review record](review.md),
[project tracker](../../progress-tracker.md).

## Current checkpoint

- Main step: 2, labeled fixtures and seeded generation, complete at this checkpoint.
- Status: 746 labeled synthetic rows (373 per persona), January–June coverage, separate ground truth, and frozen development/challenge fixtures verified. Luna High: 54 passed, exit 0.
- Waiting for: owner `NEXT` to authorize Step 3 only.

## Step log

| Step | Substeps completed | Files changed | Checks and results | Local run evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Planning | Read governing context, source plan, starter outline, manifests and existing AI boundary; scoped V1; recorded owner-confirmed field agreement. | Feature plan, progress, review and project tracker. | Manual document/source comparison; no application tests needed for planning. | N/A, no runtime changes. | Draft ready for owner review. |
| 1: Package/contracts | Reviewed concrete schemas, validation and ID rules; wrote expectations before frozen types; added owner-required `bank`; configured explicit packaging and handoff setup. | pyproject.toml; ml/__init__.py; ml/types.py; tests/ml/test_contracts.py; tests/ml/test_package.py; docs/ml_v1_handoff.md; owner-directed plan/context updates; feature/tracker records. | Luna High: focused suite 46 passed, 0 failed/skipped; copied suite outside checkout 46 passed, 0 failed/skipped. Both exit 0. Smoke assertions passed. Pytest cache-write warning on each run. | Editable and regular isolated installs; regular package imported from its site-packages outside checkout, version 0.1.0, only ML distribution files. Initial sandbox PyPI failure resolved via scoped escalation. | Complete; waiting for `NEXT`. |
| 2: Labeled data | Exact category/pair answers, independent challenge wording/freeze, seeded personas, separate labels, manifest and exhaustive pair/data checks. | ml/synthetic.py; tests/ml/fixtures/development.json; tests/ml/fixtures/challenge.json; tests/ml/test_synthetic.py; feature status/progress/review and tracker. | Luna High: `python -m pytest tests/ml/test_synthetic.py tests/ml/test_contracts.py`, exit 0, 54 passed, 0 failed, no warnings. Earlier failures and fixes preserved in review. | Generator exercised for seeds 20261111 and 7; 746 rows, 373 per persona, every date 2026-01-01–2026-06-30; six candidate labels. Each fixed split: 23 cases, 57 rows, 10 pair labels. | Complete; waiting for `NEXT`. |
| 3: Categorization | None. | None. | Not run; implementation pending. | None. | Pending. |
| 4: Reconciliation | None. | None. | Not run; implementation pending. | None. | Pending. |
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

- Steps 1–2 contracts, packaging, labeled fixtures and generator are implemented; no categorizer, reconciler or measured ML performance exists yet. The planned `python -m ml.eval.run --out reports/eval_v1.md` command will generate the fixed synthetic evaluation report for local review and CI.
- Concrete result schemas and validation, including required `Txn.bank`, are recorded in the handoff contract and verified by Step 1 tests.
- Confirm current backend/AI recipients before any externally authorized handoff.
- Hosted CI execution requires authorized publication; a workflow file alone is
  not CI run evidence.
- Initial `git status` hit ownership protection; a command-local safe.directory
  override enabled read-only inspection. No global Git configuration changed.
- Existing `.gitignore` changes and untracked instruction/context documents were
  present before this task and must be preserved.

## Final verification

- Documentation inspection: Steps 1–2 reviewed against ML_PLAN.md and the saved plan; Step 2 self-review and challenge freeze are recorded in review.md.
- Tests/runtime: Luna High ran the focused and copied outside-checkout suites (46 passed each) and the regular-install smoke assertions (passed). Both pytest runs emitted one cache warning: WinError 5 creating `.pytest_cache`. The regular pip command's final status was not captured, but `pip show` and outside-checkout imports confirm installation. Evaluation is outside Step 1.
- Acceptance criteria status: Step 1 contract and package setup verified; AC2 has contract tests and installed-package evidence. AC1/AC6 remain partially satisfied until later public functions, rules, CLI and candidate identity are implemented. Other full-feature criteria await their planned steps.




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
