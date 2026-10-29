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
