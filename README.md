# SpendLens

API-first spending review. Users import transactions, protect essentials,
and test savings scenarios. Code calculates. AI only explains.
Built for the Korabytes Build in Public Challenge.

## Status
Early build. Demo data is synthetic. Kora runs in test mode only.

## Layout
- `api/`  FastAPI backend (Olamilekan)
- `ml/`   categorization, reconciliation, forecast (Caleb)
- `ai/`   explanation and chat harness (Tobi)
- `web/`  demo app (Fisayo)
- `fixtures/`  shared JSON that every part tests against
- `docs/` PRDs and TRDs

## Rules
1. No real transactions in this repo. Synthetic data only.
2. No secrets in git. Use `.env` locally.
3. Money is integer kobo everywhere.
4. Interfaces change only after the team agrees.

## Evaluation

Run the deterministic, provider-free evaluation with:

```text
python -m ai.eval --fake
```

Fake mode writes `docs/eval_fake.json`. Its latency measures local harness
execution, not model latency. For a provider-backed run, configure one
supported provider API key
(`GROQ_API_KEY`, `GEMINI_API_KEY`, or `LLM_API_KEY`), then run. Provider
model variables are optional because `ai.llm` supplies defaults:

```text
python -m ai.eval --min-pass 0.9
```

Live mode writes `docs/eval_latest.json` only after a run is available. Use
`--min-pass FLOAT` to set the minimum passing-case rate required for exit
status 0 (the default is `0.9`). Status 2 indicates a configuration,
evaluation, or report-output error.

The report rates are calculated per evaluation case:

- **Pass rate:** cases with a model-sourced explanation that passes every
  known-answer check (zero check failures).
- **Fallback rate:** cases served by the deterministic fallback explanation.
- **Check-fail rate:** cases with a model response that fails a known-answer check.
- **Error rate:** cases that could not produce a usable explanation.
- **Retry rate:** cases that required one or more additional model calls.
