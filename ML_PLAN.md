# SpendLens ML implementation plan

## Purpose and product context

Build `ml/`, a pure Python data-intelligence package imported by the SpendLens backend during transaction import and analysis. It categorizes spending, identifies duplicate, transfer, refund, and recurring-payment candidates, and forecasts category spending. Code calculates all numbers; AI may explain only validated results. The demo app represents an embedding bank or fintech app, and Kora Checkout handles paid features.

SpendLens is API-first. The free-versus-Pro offer is an untested hypothesis: Free includes one summary and a view-only scenario; Pro (30 days, test price set by environment variable) adds saved scenarios, month comparison, and goal progress, with forecasts and chat later. No banking passwords, money movement, automatic cancellations, or claims about users, revenue, partnerships, accuracy, or compliance. Do not copy another company's brand or UI. Use synthetic data only; never commit real transactions or use them without written consent.

## Roadmap and dates

| Version / date | Deliverables |
| --- | --- |
| V1, Oct 30-Nov 6 (checkpoint Nov 7) | Rule categorizer with confidence and abstention; duplicate and internal-transfer candidates; seeded synthetic data and labeled tests; evaluation report V1. |
| V2, Nov 7-Nov 13 (checkpoint Nov 14, lifeline) | Category-spending forecasts for 7 and 30 days with ranges; recurring-payment candidates; baseline comparisons; evaluation report V2. |
| V3, Nov 14-Nov 19 (checkpoint Nov 20) | Chat-friendly output shapes and known-answer chat test questions. No new models. Optional text classifier only if rules leave many rows Uncategorized and it beats rules-only on held-out rows. |

Feature freeze Nov 18; rehearsal and backup video Nov 18-19. Milestones: Oct 31 generator, categories and 500+ labeled rows; Nov 1 interface freeze and handoff to backend and AI engineers; Nov 4 categorizer and reconciliation; Nov 6 report V1; Nov 10 forecast baselines; Nov 12 forecast, recurring detection and report V2; Nov 16 chat outputs and test questions; Nov 18 feature freeze.

## Package, input, and result contracts

Package layout: `ml/{types.py,categorize.py,reconcile.py,recurring.py,forecast.py,synthetic.py,rules/categories.yaml,eval/run.py}` with tests under `tests/ml/`. Keep it independent of backend services: no network calls, database access, web server, or logging of descriptions. Python dependencies are pandas, numpy, scikit-learn, and pytest; add nothing else without team agreement. Backend owns CSV validation/conversion and user corrections.

Canonical V1 CSV: UTF-8, at most 5 MB and 5,000 rows; columns `date` (YYYY-MM-DD), optional `time` (HH:MM), `description`, positive decimal `amount` in NGN, `direction` (`debit` or `credit`), `account_alias`, required `bank`, and optional `reference`. NGN only for MVP; PDF statements and bank connections come later. Convert money to integer kobo, never float amounts.

```python
MODEL_VERSION = "ml-0.1.0"
Bank = Literal["opay", "gtbank", "ecobank", "access", "zenith", "other"]

@dataclass(frozen=True)
class Txn:
    id: str
    date: date
    time: time | None
    description: str
    amount_kobo: int       # positive
    direction: str         # debit or credit
    account_alias: str
    reference: str | None
    bank: Bank               # required normalized institution

categorize(txns: list[Txn]) -> list[CategoryResult]
find_reconciliation_candidates(txns: list[Txn]) -> list[Candidate]
detect_recurring(txns: list[Txn]) -> list[RecurringCandidate]  # V2
forecast_category(history: list[Txn], category: str, horizon_days: int) -> Forecast  # V2
```

Freeze interfaces by Nov 1 and share with Olamilekan (backend) and Olatunji (AI). Every result carries `model_version`, confidence, and a method label (`rule`, `model`, or `baseline`) as appropriate. Proposed additions to the TRD are `model_version` on every result and `method` on reconciliation candidates; preserve confidence fields and confirm the additions with the team before freezing. V1 uses method `rule`; its confidence describes rule strength, not measured probability.

The canonical ML transaction requires `bank`. The integration caller passes
the output of `ai.banks.normalize_bank`: `opay`, `gtbank`, `ecobank`, `access`,
`zenith`, or `other`. If the import source does not identify a supported
institution, the caller supplies `other`; the ML field itself is never omitted.
The review table may label this “Bank Category.” It identifies
the institution, not the transaction's spending category, and does not affect
V1 categorization or reconciliation decisions.

## V1 behavior: categorization and reconciliation

Categories: Food, Transport, Airtime and Data, Entertainment, Shopping, Bills and Utilities, Education, Health, Savings and Transfers, Income, Uncategorized. Normalize descriptions by lowercasing, stripping digits and punctuation, and collapsing spaces. Store keyword and phrase rules in `rules/categories.yaml` as JSON-compatible YAML so V1 needs no YAML library. Match complete words or phrases. TRD proposes exact keyword confidence 0.9, partial match 0.6, and abstention below 0.5; this plan uses a conservative V1 rule: return a uniquely supported category at 0.9 and `Uncategorized` at 0.0 for absent, ambiguous, or conflicting evidence. Preserve input order and return exactly one result per transaction. Backend stores user corrections and applies them before calling this function; per-user override maps are a later interface extension.

Duplicate candidates match account, direction, amount, date, and normalized description. If both references exist they must match; matching references give confidence 0.9. Without references, matching fields give 0.6. Conflicting references prevent a finding. Identical same-day purchases may be legitimate, so retain them as review candidates and never auto-delete/exclude them.

Internal-transfer candidates pair equal debit and credit amounts across different accounts within one day when at least one description has a transfer clue; confidence 0.8. Refund/reversal candidates (planned follow-up) match a credit to an earlier debit with the same amount and merchant key. All findings include stable transaction IDs and a clear reason. Nothing is automatically deleted or excluded from totals; confirmation belongs to the user/backend.

## V2 behavior: recurring charges and forecasts

Recurring candidates group by merchant key and amounts within 5% (proposed). Accept intervals near 7, 14, 30, or 365 days, within plus or minus 3 days, and require at least 3 occurrences. Output remains a candidate; the UI must not call it a confirmed subscription.

Forecast observable category spend over the next 7 and 30 days, plus expected recurring charges; never predict a specific purchase. Compare a trailing 4-week average and same-weekday-last-week baseline for daily series. Optional ridge or gradient-boosting models may use lag features, and ship only if they beat the best baseline on rolling-origin evaluation. Build ranges from empirical quantiles of baseline residuals. Abstain with a reason when history is under 8 weeks or over 20% of days are missing (proposed thresholds). Report MAE and range coverage alongside the baseline. Use time-ordered splits only; never include future data in training windows. If a model does not beat baseline, ship the baseline and state that clearly.

## Synthetic data and evaluation

Generate at least 500 labeled transactions across student-with-allowance and early-career-salary personas, each with at least six months of history. Use invented Nigerian statement-style descriptions such as POS, airtime, utilities, salary, and transfers. Seed repeat imports, legitimate identical same-day purchases, transfers, transfer fees, refunds, missing times, ambiguous descriptions, and missing counterpart accounts. Keep ground-truth labels separate from transaction inputs so detection functions cannot access answers. Use a separate fixed challenge set with independently written descriptions and expected answers. Synthetic accuracy does not establish real-world accuracy; state this in every report.

Run with `python -m ml.eval.run --out reports/eval_v1.md`, supported by an installable `ml` package sourced from `ml/`. Report dataset seeds and row counts; categorization accuracy, per-category precision/recall, abstain rate and confident mistakes; reconciliation precision/recall; forecast MAE and range coverage versus baseline when available; package/model version and commit hash. Compare categorization against a baseline that always predicts the most common development-set category. Run the evaluation in CI so regressions fail the build; each report links to a commit hash. Gift uses reported numbers as written with the synthetic-data caveat.

Tests: write expected outputs first; exact fixtures cover all hand-written cases and synthetic edge cases; property check categorization output length equals input length; determinism check identical input/seed yields identical output. Test duplicates and transfers across account/date/amount boundaries, fees, and absent counterpart transactions. Repeated purchases remain review candidates. Add ML tests to repository discovery, run alongside existing AI tests, and add CI checks for the tests and evaluation. Set numerical thresholds after report V1; initial gates are correctness, safe behavior, and honest reporting. Wrong confident categorization predictions should be rarer than abstentions; proposed targets are not measured results.

## Safety, scope, and delivery

No logging descriptions; no real transaction data in repository, notebooks, or screenshots; no real data use without written consent; no package network calls. No emotion or motive inference, exact-next-purchase prediction, deep learning, fine-tuning, or training on real user data without consent. Forecasts are ranges and abstain when data is thin. Risks: synthetic data can overstate performance, and two weeks of history is inadequate for forecasting; generate at least six months per persona. Rules and baselines are acceptable under time pressure; a weak model is not an upgrade.

Implementation order: contract/package setup → labeled examples and seeded generator → categorization → reconciliation → evaluation/report V1 and backend handoff → V2 recurring detection and forecast baselines/model evaluation → V3 chat output shapes and known-answer questions. Backend owns CSV validation, amount conversion, user corrections, and confirmation of reconciliation findings. AI Engineer turns validated outputs into plain-language explanations and chat tool results; Business Analyst uses reports as pitch evidence.

## Source documents

Consolidated from the ML Engineer Product Requirements Document and Technical Requirements Document (both draft for team review, Oct 29, 2026). This plan is the single working reference; proposed thresholds and contract changes remain proposals until agreed.


