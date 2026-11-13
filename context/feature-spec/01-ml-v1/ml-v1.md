# ML V1: categorization and reconciliation

Status: Step 2 explicitly authorized by the owner on 2026-11-11 (Africa/Lagos); subsequent steps remain gated by NEXT. Primary source: [ML_PLAN.md](../../../ML_PLAN.md).
Evidence: [progress](ml-v1-progress.md), [review](review.md), and
[project tracker](../../progress-tracker.md).

## Outcome and acceptance criteria

Give the backend an installable, deterministic Python package that categorizes
canonical synthetic transactions and returns reviewable duplicate and internal
transfer candidates. Deliver reproducible synthetic evaluation, not a claim of
real-world performance.

| ID | Acceptance criterion | Required proof |
| --- | --- | --- |
| AC1 | Source under `ml/` installs as the `ml` Python package; public functions and evaluation CLI import outside the checkout. | Installed-package smoke check including packaged rule resources. |
| AC2 | Frozen `Txn` matches ML_PLAN.md; positive integer kobo, typed dates/times, required normalized bank institution, no backend or network dependency. | Contract fixtures and boundary tests; package inspection. |
| AC3 | Categorization returns exactly one ordered result per input, complete-word/phrase matches, unique support at 0.9, otherwise Uncategorized at 0.0. | Exact fixtures, ambiguity tests, cardinality and deterministic checks. |
| AC4 | Duplicate candidates obey all account/direction/amount/date/normalized-description/reference rules; no automatic deletion or exclusion. | Reference matrix and legitimate identical-purchase fixtures. |
| AC5 | Transfer candidates require equal opposite amounts, different accounts, at most one calendar day, and at least one transfer clue; confidence 0.8. | Boundary, fee, no-clue and missing-counterpart fixtures. |
| AC6 | Results expose stable transaction IDs, confidence, method `rule`, model version `ml-0.1.0`; findings have clear reasons. | Contract tests and deterministic candidate identity/order checks. |
| AC7 | Seeded data has at least 500 labeled rows total, both personas, and at least six calendar months per persona; labels stay separate. | Dataset manifest, determinism and edge-case tests. |
| AC8 | Independently authored fixed challenge cases are separate from development data and rules. | Challenge provenance and distinct development/challenge evaluation sections. |
| AC9 | V1 report contains all applicable metrics, development-majority baseline, seeds, counts, versions and commit hash, with the synthetic-data caveat. | Reproducible `reports/eval_v1.md` and report correctness tests. |
| AC10 | CI runs repository tests and V1 evaluation; initial failures gate correctness/report integrity, not invented numerical targets. | Workflow inspection and observed CI run when available. |
| AC11 | Existing AI contracts and provider-free behavior are preserved; handoff explains integration boundaries and known limitations. | Existing tests, fake evaluation and handoff documentation. |

## Scope and constraints

Included: package/contracts, labeled examples, seeded generator, categorization,
duplicate/internal-transfer candidates, tests, evaluation, CI, and local handoff
documentation. Historical roadmap dates are context, not completion evidence.

Excluded: FastAPI endpoints, CSV ingestion/conversion, persistence, user overrides,
confirmation workflows, UI, billing, refund/reversal detection, recurring
detection, forecasting, chat, classifiers, new ML frameworks and real data.
Refund examples are included as negative/challenge cases, not V1 detections.

Constraints and decisions:

- Pure Python functions: no network, database, web server or description logging.
- Backend owns CSV limits/validation, decimal-to-kobo conversion, corrections,
  totals and confirmation. Candidates never mutate inputs or totals.
- Preserve the eleven exact category names from ML_PLAN.md.
- Require the normalized institution as `Txn.bank` (`opay`, `gtbank`,
  `ecobank`, `access`, `zenith`, or `other`). The integration caller supplies
  the output of `ai.banks.normalize_bank`; ML does not import AI or repeat alias rules.
  The table may call this column “Bank Category.” It is descriptive metadata,
  separate from spending category, and does not affect ML decisions.
- JSON-compatible YAML rules use the standard JSON parser; no YAML dependency.
- Do not add pandas/numpy/scikit-learn merely because allowed; V1 may use the
  standard library. pytest is the test dependency. Use setuptools for packaging,
  with build tooling separated from runtime dependencies.
- Owner confirmed on 2026-11-05 that team agreement is obtained for
  `model_version` on results and candidate `method`. This confirms those fields,
  not unspecified result schemas or external contact identities.
- Step 1 reviewed the exact result shapes in the handoff contract. Any
  material disagreement returns to the owner; do not silently change contracts.
- Every test and evaluation acceptance command runs only through delegated
  `gpt-6-luna`, reasoning `high`, with exact command, working directory and
  environment. Stop if unavailable; record exit status, counts and limitations.
- No local web/API server or UI verification is required for this pure package.
- Preserve all other governing context requirements and unrelated worktree changes; the package/import name is updated to `ml` at the owner direction.

## Technical design

Data flow: backend-owned canonical `list[Txn]` -> pure categorization and
reconciliation functions -> typed results -> backend review/confirmation.
Separately: seeded generator + independent fixed challenge transactions and
separate ground truth -> evaluator -> synthetic report. AI continues to receive
backend-validated aggregates through its existing contract, not ML rows.

### Package and contracts

Configure the root `pyproject.toml` with an explicit package mapping for the `ml/`
source directory, including `rules/categories.yaml` as package data and `eval`
as a subpackage. Preserve current pytest discovery and AI imports. Verify a
regular install into a clean environment, not just imports from repository root.

`Txn` is frozen and has the fields in ML_PLAN.md: `id`, `date`, optional
`time`, `description`, positive integer `amount_kobo`, `direction`, `account_alias`,
optional `reference`, and required `bank`. `bank` accepts the
normalized values `opay`, `gtbank`, `ecobank`, `access`, `zenith`, or `other`.
The caller always passes a value from the shared AI bank normalizer; ML does not
import AI code. Reject invalid typed contract inputs without echoing
descriptions; this does not implement CSV parsing or conversion. IDs must be
unique within a call so candidate identity is unambiguous; document and test
the chosen error behavior during Step 1 contract review.

Concrete result schemas reviewed in Step 1 (see [handoff contract](../../../docs/ml_v1_handoff.md)):

- Frozen `CategoryResult`: `txn_id`, `category`, `confidence`, `method`,
  `model_version`. Stable association and order follow input.
- Frozen `Candidate`: deterministic `id`, `kind` (`duplicate` or
  `internal_transfer`), two `txn_ids`, `reason`, `confidence`, `method`,
  `model_version`. Pair IDs derive from kind and sorted transaction IDs using a
  stable digest, never Python's randomized hash or descriptions.
- Public functions: `categorize(txns: list[Txn]) -> list[CategoryResult]` and
  `find_reconciliation_candidates(txns: list[Txn]) -> list[Candidate]`.
- Empty input returns empty lists. Functions do not mutate transactions.
  Candidate output is sorted deterministically by kind and transaction IDs.
  Return all qualifying pairs; do not arbitrarily pick a single counterpart.

### Step 1 contract review record (2026-11-05)

The owner authorized Step 1; the proposed schemas were adopted without a
material disagreement. The owner later requested an additive required `bank`
field to match the institution values already normalized by `ai/banks.py`, and
clarified that this field applies only to ML code. `ml/types.py` implements the
frozen types above.
The [handoff contract](../../../docs/ml_v1_handoff.md) records exact validation,
error types, nonblank/optional fields, naive-time handling, confidence metadata,
unique per-call IDs and the unambiguous SHA-256 candidate-ID encoding. Wrong
types raise TypeError; invalid values/duplicate IDs raise ValueError without
echoing inputs. Backend conversion and confirmation remain outside ML.

Step 1 adds only contracts, shared validation, version exports and packaging.
The public categorizer/reconciler, packaged rule resources and evaluation CLI
remain assigned to Steps 3, 4 and 5 respectively. Their installed-resource and
callable proof is pending those steps; Step 1 does not claim full AC1/AC6.
Python >=3.10 and distribution `spendlens-ml` 0.1.0 use no runtime dependency;
test extras add pytest and setuptools is build tooling. This records routine
contract choices within the approved plan, not a change in feature scope.

### Rules and candidate evidence

Share normalization across rules and reconciliation: lowercase, remove digits
and punctuation, collapse spaces; pin punctuation/token boundaries with exact
fixtures before coding. Match whole normalized words/phrases, not substrings.
Multiple matched rules for one category remain unique support; evidence for
different categories causes abstention. Do not infer a category from amount,
persona or hidden labels. Use explicit, reviewed income/transfer phrases.

Duplicate pairs require same account, direction, amount, date and normalized
description. Two present equal references give 0.9; two present conflicting
references prevent a duplicate; one or both references absent give 0.6.
Internal transfers require different accounts, opposite directions, exact equal
integer amounts, date distance <= 1 day, and a configured transfer clue on at
least one side. Fees are separate transactions and never netted into amounts.
Reasons explain rule evidence without copying descriptions. Duplicates and
transfers remain independent candidate kinds; no total is recalculated.

### Data and evaluation

Use deterministic IDs, stable ordering, fixed dates and explicit seeds. Cover
student allowance and early-career salary patterns over at least six calendar
months each. Include repeat imports, legitimate identical purchases, transfer
fees, refunds, missing times, ambiguities and missing counterpart accounts.
Fixtures and generated ground truth contain category labels and candidate-pair
labels separately from transaction inputs. Distinguish candidate labels from
claims that a repeated purchase should be deleted.

Author and freeze challenge descriptions/answers before category-rule work.
Do not tune rules against challenge failures; report limitations honestly.
Development data supplies the most-common-category baseline; break ties
deterministically. Report development and challenge metrics separately, with
denominators, zero-support/zero-denominator conventions and pair-level scoring
by candidate kind. Report accuracy, per-category precision/recall, abstention,
confident mistakes and duplicate/transfer precision/recall against labeled
candidate eligibility. Compare confident mistakes and abstentions explicitly;
do not invent measured targets. Forecast metrics are N/A for V1.

The CLI is a small, non-interactive way to run the fixed synthetic V1 evaluation and write its report; it does not add an interactive product flow or change rule behavior. Developers and CI use the same command so results can be reproduced after rule changes. Run `python -m ml.eval.run --out reports/eval_v1.md`; it records seeds,
persona date spans, row counts/splits, package/model version, source commit hash
and dirty-worktree state, metric definitions and the synthetic-data caveat.
Do not claim an uncommitted report describes a clean source commit. Reports
contain aggregate metrics and synthetic IDs where necessary, no descriptions.
CI regenerates the report, runs correctness/report-integrity gates and retains
the generated report as an artifact. Numerical regression thresholds are a
separate post-V1 measured decision.

## Expected files

| File or directory | Planned change | Reason |
| --- | --- | --- |
| `pyproject.toml` | Packaging metadata/mapping, package resources, test extras; preserve pytest settings. | Installable package and reproducible setup. |
| `ml/__init__.py`, `ml/types.py` | Public exports, version and frozen contracts. | Backend integration boundary. |
| `ml/normalize.py` | Shared normalization helper. | Consistent category/duplicate evidence. |
| `ml/synthetic.py` | Seeded transactions and separate ground truth. | Reproducible labeled development data. |
| `ml/categorize.py`, `ml/rules/categories.yaml` | Conservative rules and packaged resources. | V1 categorization. |
| `ml/reconcile.py` | Stable duplicate/transfer candidate pairs. | V1 reconciliation. |
| `ml/eval/__init__.py`, `ml/eval/run.py` | Small module-run CLI for the fixed synthetic evaluation and report generation; invoked locally and in CI. | Reproduce the same measurements after rule changes and retain reviewable evidence. |
| `tests/ml/test_contracts.py`, `tests/ml/test_package.py` | Contract and installed-resource checks. | Catch mapping and public-boundary failures. |
| `tests/ml/fixtures/development.json`, `tests/ml/fixtures/challenge.json` | Independent input/answer sections with provenance. | Expected outputs before logic; fixed challenge. |
| `tests/ml/test_synthetic.py`, `tests/ml/test_normalize.py` | Seed/coverage and token-boundary checks. | Data and normalization correctness. |
| `tests/ml/test_categorize.py`, `tests/ml/test_reconcile.py` | Exact behavior and boundary tests. | AC3–AC6 evidence. |
| `tests/ml/test_eval.py` | Metrics, baseline and report/CLI checks. | Prevent misleading evaluation. |
| `.github/workflows/ml-v1.yml` | Offline tests/evaluation and report artifact. | CI correctness gate. |
| `reports/eval_v1.md` | Generated synthetic report. | Reproducible evidence. |
| `docs/ml_v1_handoff.md`, `README.md` | Installation, examples, contracts and limits. | Reviewable local handoff; no unsolicited messaging. |
| `context/feature-spec/01-ml-v1/{ml-v1.md,ml-v1-progress.md,review.md}`, `context/progress-tracker.md` | Plan, actual evidence and review history. | Required checkpoints. |

No V2 placeholder modules, migrations, API or web changes are planned.

## Ordered implementation steps

All commands below run from the repository root unless stated otherwise.
Every step updates progress, the single review record and the project tracker
with observed results. Each step ends at a `NEXT` checkpoint. Checks listed are
future commands, not claims that they currently exist or pass.

### Step 1: Package and contract setup

- Goal / expected result: installable package and reviewed concrete V1 contracts.
- Dependencies: owner resolution of any material result-shape disagreement.
- Files: `pyproject.toml`, `ml/__init__.py`, `ml/types.py`,
  `tests/ml/test_contracts.py`, `tests/ml/test_package.py`, handoff contract section.
- Substeps:
  1. Review the proposed result schemas, ID rules and invalid-input behavior;
     record the agreed contract before interface freeze.
  2. Write contract expectations first; implement frozen types, exports and
     version metadata without implementing later business logic.
  3. Configure explicit packaging and document setup; inspect the installed
     package from a temporary directory outside the checkout.
- Automated tests: Luna High runs `python -m pytest tests/ml/test_contracts.py
  tests/ml/test_package.py`; expected imports, immutability and contract checks pass.
- Local run required: yes; prepare an isolated environment, install with
  `python -m pip install -e ".[test]"`; delegate the installed-package acceptance
  smoke check. Network/dependency restrictions must be recorded or escalated.
- UI computer-use checks: N/A, pure Python package.
- Review record: append Step 1 evidence, fixes, reruns and remaining proof.
- Checkpoint: report contract/package evidence; stop for `NEXT`.

### Step 2: Labeled fixtures and seeded generation

- Goal / expected result: independent expected answers and >=500 labeled rows.
- Dependencies: Step 1 contracts.
- Files: `ml/synthetic.py`, `tests/ml/fixtures/development.json`,
  `tests/ml/fixtures/challenge.json`, `tests/ml/test_synthetic.py`.
- Substeps:
  1. Write exact category and candidate answers for all specified edge cases;
     independently author and freeze the challenge set before rule work.
  2. Implement seeded personas with >=six calendar months each; keep labels
     structurally separate from canonical transaction inputs.
  3. Verify seed/ID determinism, date coverage, minimum count, and every edge
     case; record seeds, manifests and challenge provenance.
- Automated tests: Luna High runs `python -m pytest tests/ml/test_synthetic.py
  tests/ml/test_contracts.py`; all expectations pass.
- Local run required: yes, generator exercised through delegated tests; no server.
- UI computer-use checks: N/A.
- Review record: append data audit and challenge independence evidence.
- Checkpoint: report dataset evidence; stop for `NEXT`.

### Step 3: Conservative categorization

- Goal / expected result: deterministic categorizer with explicit abstention.
- Dependencies: Steps 1–2; development fixtures only for rule development.
- Files: `ml/normalize.py`, `ml/categorize.py`, `ml/rules/categories.yaml`,
  `tests/ml/test_normalize.py`, `tests/ml/test_categorize.py`, package resource test.
- Substeps:
  1. Pin normalization expectations, word/phrase boundaries, repeated same-category
     evidence and conflicting-category evidence before implementing rules.
  2. Implement exact category vocabulary and 0.9/0.0 policy; preserve cardinality,
     order, IDs and metadata; include no hidden-label access.
  3. Verify empty inputs, case/digits/punctuation/spacing, substring negatives,
     ambiguity, determinism and installed rule-resource availability.
- Automated tests: Luna High runs `python -m pytest tests/ml/test_normalize.py
  tests/ml/test_categorize.py tests/ml/test_package.py`.
- Local run required: yes, delegated installed-package/resource check; no server.
- UI computer-use checks: N/A.
- Review record: append rule behavior and packaged-resource evidence.
- Checkpoint: report categorization evidence; stop for `NEXT`.

### Step 4: Duplicate and internal-transfer candidates

- Goal / expected result: stable, explainable candidate pairs with no mutations.
- Dependencies: Steps 1–3, shared normalization and labeled pair expectations.
- Files: `ml/reconcile.py`, `tests/ml/test_reconcile.py`.
- Substeps:
  1. Write duplicate reference matrix including one missing reference,
     legitimate repeated purchases and account/direction/date/amount mismatches.
  2. Implement duplicate pairs and transfer pairs with deterministic IDs/order,
     clear reasons, exact confidences and version/method metadata.
  3. Cover same/next day and two-day boundaries, both date directions, equal vs
     unequal amounts, fees, missing counterparts, multiple eligible pairs,
     permutation stability and input immutability; no refund-specific matcher.
- Automated tests: Luna High runs `python -m pytest tests/ml/test_reconcile.py
  tests/ml/test_normalize.py tests/ml/test_contracts.py`.
- Local run required: yes, delegated fixture execution; no server.
- UI computer-use checks: N/A.
- Review record: append candidate safety and boundary evidence.
- Checkpoint: report reconciliation evidence; stop for `NEXT`.

### Step 5: Evaluation, CI and handoff documentation

- Goal / expected result: reproducible V1 evidence and a reviewable integration guide.
- Dependencies: Steps 1–4; verify AI test dependencies and CI package setup.
- Files: `ml/eval/{__init__.py,run.py}`, `tests/ml/test_eval.py`,
  `reports/eval_v1.md`, `.github/workflows/ml-v1.yml`, `docs/ml_v1_handoff.md`, README.
- Substeps:
  1. Write known-answer metric/baseline/report tests with explicit denominators,
     absent-class conventions, split separation and candidate-pair matching.
  2. Implement the non-interactive CLI/report, reproducibility metadata and caveats; developers and CI run the same fixed evaluation command; evaluate the
     fixed challenge without revising it or tuning rules against its answers.
  3. Add CI installation, offline repository tests and evaluation, correctness
     gates and report artifacts; do not invent post-V1 metric thresholds.
  4. Document callable examples, metadata, candidate confirmation boundary and
     limitations. Confirm current recipient identity only before external handoff;
     sending messages or publishing changes needs separate authorization.
- Automated tests: Luna High runs `python -m pytest tests/ml/test_eval.py`, then
  `python -m ml.eval.run --out reports/eval_v1.md`.
- Local run required: yes, delegated CLI invocation; inspect actual report.
  A hosted CI run requires an authorized push; record it pending if unavailable.
- UI computer-use checks: N/A.
- Review record: append report/CI/handoff evidence and CI execution limits.
- Checkpoint: report V1 measurements with caveat; stop for `NEXT`.

### Step 6: Complete review and final verification

- Goal / expected result: audit AC1–AC11 against observed evidence and fix findings.
- Dependencies: Steps 1–5; review skill at the full implementation review.
- Files: all feature implementation/tests/docs; fixes limited to approved scope.
- Substeps:
  1. Read the review skill and audit the complete change, data independence,
     pure-package boundary, contracts, candidate safety and documentation.
  2. Verify regular package installation in a clean environment and imports/rule
     resources/CLI from outside the checkout. Inspect distribution contents.
  3. Delegate `python -m pytest tests/ml`, then `python -m pytest tests`,
     `python -m ai.eval --fake`, and
     `python -m ml.eval.run --out reports/eval_v1.md` to Luna High.
     Review exact commands, exit statuses, counts and report results. Preserve
     unrelated generated artifacts; no live provider evaluation is needed.
  4. Fix findings and rerun affected checks only; inspect available hosted CI
     evidence. No Python lint/type checker is configured, so record that limit
     rather than claiming a pass or adding tooling without agreement.
  5. Map every AC to evidence; leave unavailable CI/team/runtime proof explicit.
     Update all tracking records and retain dated review history.
- Local run required: yes, installed public-function smoke checks and CLI above.
- UI computer-use checks: N/A; no UI changed.
- Review record: append full acceptance audit, findings/priorities, fixes,
  affected reruns, reviewer/verdict and remaining proof.
- Checkpoint: report final results and limitations; stop for `NEXT` as required
  by AGENTS.md, including after the final step. Do not silently start V2.




