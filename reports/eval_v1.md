# SpendLens ML V1 synthetic evaluation

Synthetic accuracy does not establish real-world accuracy.

Package: spendlens-ml 0.1.0; model: ml-0.1.0; method: rule.
Source commit: [373f777a68d0c729252503cdcd1f09f2fbbc2711](https://github.com/olatunjitobiloba/spendlens/commit/373f777a68d0c729252503cdcd1f09f2fbbc2711); worktree at invocation: **dirty**.
A dirty worktree includes uncommitted source; the commit alone does not reproduce it.
Reproduction: `python -m ml.eval.run --out reports/eval_v1.md` from the repository root.
Generated development seed: 20261111; rows: 746.
Fixed development and frozen challenge: independently authored, no random seed.
Fixed development cases: 23; challenge cases: 23.
Challenge frozen normalized-UTF-8 SHA-256: `9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`.

## Dataset provenance

| Persona | Rows | Start | End |
| --- | ---: | --- | --- |
| student_allowance | 373 | 2026-01-01 | 2026-06-30 |
| early_career_salary | 373 | 2026-01-01 | 2026-06-30 |

development decoded UTF-8 (newline-normalized by Python) SHA-256: `2870c1039303310d8bde4cb1c8b2f7535d6f1bdf9ac2fea15a3d5dba5f0bbdfb`.

challenge decoded UTF-8 (newline-normalized by Python) SHA-256: `9e193f0b5d158a964cdec10fda5ee1df4114313a5d477e60dc8ca7e6ca5496bd`.

## Metric definitions

Accuracy = correct categories / all labeled rows, including correctly predicted Uncategorized.
Abstain rate = Uncategorized predictions / all rows, including correct abstentions.
Confident mistakes = wrong predictions with confidence > 0; rate denominator is all rows.
Class precision = true positives / predicted class rows; recall = true positives / labeled class rows.
Candidate precision = TP / (TP + FP); recall = TP / (TP + FN), by kind and unordered ID pair.
Labels describe candidate eligibility, including legitimate repeated purchases, never deletion decisions.
Zero denominators are N/A; rates are fractions rounded to six decimals; counts are exact.
Baseline always predicts **Uncategorized**, the majority of generated plus fixed development labels.
Baseline ties use the documented category order. Challenge labels never fit the baseline or rules.

## generated_development

Rows: 746; correct: 746; accuracy: 1.000000.
Abstentions: 82; rate: 0.109920.
Confident mistakes: 0; rate: 0.000000.
Confident mistakes are fewer than abstentions; this is an observation, not a regression threshold.
Majority baseline correct: 82/746; accuracy: 0.109920.

| Category | Support | Predicted | TP | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Food | 74 | 74 | 74 | 1.000000 | 1.000000 |
| Transport | 83 | 83 | 83 | 1.000000 | 1.000000 |
| Airtime and Data | 66 | 66 | 66 | 1.000000 | 1.000000 |
| Entertainment | 73 | 73 | 73 | 1.000000 | 1.000000 |
| Shopping | 75 | 75 | 75 | 1.000000 | 1.000000 |
| Bills and Utilities | 62 | 62 | 62 | 1.000000 | 1.000000 |
| Education | 74 | 74 | 74 | 1.000000 | 1.000000 |
| Health | 77 | 77 | 77 | 1.000000 | 1.000000 |
| Savings and Transfers | 68 | 68 | 68 | 1.000000 | 1.000000 |
| Income | 12 | 12 | 12 | 1.000000 | 1.000000 |
| Uncategorized | 82 | 82 | 82 | 1.000000 | 1.000000 |

| Candidate kind | Expected | Predicted | TP | FP | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| duplicate | 4 | 4 | 4 | 0 | 0 | 1.000000 | 1.000000 |
| internal_transfer | 2 | 2 | 2 | 0 | 0 | 1.000000 | 1.000000 |

## fixed_development

Rows: 57; correct: 57; accuracy: 1.000000.
Abstentions: 18; rate: 0.315789.
Confident mistakes: 0; rate: 0.000000.
Confident mistakes are fewer than abstentions; this is an observation, not a regression threshold.
Majority baseline correct: 18/57; accuracy: 0.315789.

| Category | Support | Predicted | TP | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Food | 20 | 20 | 20 | 1.000000 | 1.000000 |
| Transport | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Airtime and Data | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Entertainment | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Shopping | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Bills and Utilities | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Education | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Health | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Savings and Transfers | 11 | 11 | 11 | 1.000000 | 1.000000 |
| Income | 1 | 1 | 1 | 1.000000 | 1.000000 |
| Uncategorized | 18 | 18 | 18 | 1.000000 | 1.000000 |

| Candidate kind | Expected | Predicted | TP | FP | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| duplicate | 4 | 4 | 4 | 0 | 0 | 1.000000 | 1.000000 |
| internal_transfer | 6 | 6 | 6 | 0 | 0 | 1.000000 | 1.000000 |

## challenge

Rows: 57; correct: 17; accuracy: 0.298246.
Abstentions: 56; rate: 0.982456.
Confident mistakes: 1; rate: 0.017544.
Confident mistakes are fewer than abstentions; this is an observation, not a regression threshold.
Majority baseline correct: 18/57; accuracy: 0.315789.

| Category | Support | Predicted | TP | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| Food | 20 | 0 | 0 | N/A | 0.000000 |
| Transport | 1 | 1 | 0 | 0.000000 | 0.000000 |
| Airtime and Data | 1 | 0 | 0 | N/A | 0.000000 |
| Entertainment | 1 | 0 | 0 | N/A | 0.000000 |
| Shopping | 1 | 0 | 0 | N/A | 0.000000 |
| Bills and Utilities | 1 | 0 | 0 | N/A | 0.000000 |
| Education | 1 | 0 | 0 | N/A | 0.000000 |
| Health | 1 | 0 | 0 | N/A | 0.000000 |
| Savings and Transfers | 11 | 0 | 0 | N/A | 0.000000 |
| Income | 1 | 0 | 0 | N/A | 0.000000 |
| Uncategorized | 18 | 56 | 17 | 0.303571 | 0.944444 |

| Candidate kind | Expected | Predicted | TP | FP | FN | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| duplicate | 4 | 4 | 4 | 0 | 0 | 1.000000 | 1.000000 |
| internal_transfer | 6 | 6 | 6 | 0 | 0 | 1.000000 | 1.000000 |

## Limitations and gates

Forecast MAE, range coverage and forecast baseline comparisons: N/A; forecasting is outside V1.
Small invented vocabularies and synthetic cases cannot establish real-world performance.
Frozen challenge failures are reported without tuning rules or revising challenge answers.
CI gates tests, input/output integrity and report generation; no numerical quality threshold is frozen.
Candidates require backend/user confirmation and never change totals automatically.
Hosted CI execution and external team handoff require separate observed evidence.
