# ML V1: Progress

Links: [plan](ml-v1.md), [single review record](review.md),
[project tracker](../../progress-tracker.md).

## Current checkpoint

- Main step: 1, package and contract setup, complete at this checkpoint.
- Status: frozen contracts (including required normalized bank institution), ML-only packaging and Step 1 tests verified in editable and regular installs.
- Waiting for: owner `NEXT` to authorize Step 2 only.

## Step log

| Step | Substeps completed | Files changed | Checks and results | Local run evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Planning | Read governing context, source plan, starter outline, manifests and existing AI boundary; scoped V1; recorded owner-confirmed field agreement. | Feature plan, progress, review and project tracker. | Manual document/source comparison; no application tests needed for planning. | N/A, no runtime changes. | Draft ready for owner review. |
| 1: Package/contracts | Reviewed concrete schemas, validation and ID rules; wrote expectations before frozen types; added owner-required `bank`; configured explicit packaging and handoff setup. | pyproject.toml; ml/__init__.py; ml/types.py; tests/ml/test_contracts.py; tests/ml/test_package.py; docs/ml_v1_handoff.md; owner-directed plan/context updates; feature/tracker records. | Luna High: focused suite 46 passed, 0 failed/skipped; copied suite outside checkout 46 passed, 0 failed/skipped. Both exit 0. Smoke assertions passed. Pytest cache-write warning on each run. | Editable and regular isolated installs; regular package imported from its site-packages outside checkout, version 0.1.0, only ML distribution files. Initial sandbox PyPI failure resolved via scoped escalation. | Complete; waiting for `NEXT`. |
| 2: Labeled data | None. | None. | Not run; implementation pending. | None. | Pending. |
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

- Step 1 contracts and packaging are implemented; no business logic or measured ML performance exists yet. The planned `python -m ml.eval.run --out reports/eval_v1.md` command will generate the fixed synthetic evaluation report for local review and CI.
- Concrete result schemas and validation, including required `Txn.bank`, are recorded in the handoff contract and verified by Step 1 tests.
- Confirm current backend/AI recipients before any externally authorized handoff.
- Hosted CI execution requires authorized publication; a workflow file alone is
  not CI run evidence.
- Initial `git status` hit ownership protection; a command-local safe.directory
  override enabled read-only inspection. No global Git configuration changed.
- Existing `.gitignore` changes and untracked instruction/context documents were
  present before this task and must be preserved.

## Final verification

- Documentation inspection: Step 1 reviewed against ML_PLAN.md, the saved plan and the starter outline.
- Tests/runtime: Luna High ran the focused and copied outside-checkout suites (46 passed each) and the regular-install smoke assertions (passed). Both pytest runs emitted one cache warning: WinError 5 creating `.pytest_cache`. The regular pip command's final status was not captured, but `pip show` and outside-checkout imports confirm installation. Evaluation is outside Step 1.
- Acceptance criteria status: Step 1 contract and package setup verified; AC2 has contract tests and installed-package evidence. AC1/AC6 remain partially satisfied until later public functions, rules, CLI and candidate identity are implemented. Other full-feature criteria await their planned steps.



