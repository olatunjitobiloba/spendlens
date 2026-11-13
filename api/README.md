# SpendLens API

FastAPI backend for SpendLens. It accepts synthetic transaction CSVs, performs deterministic calculations, and calls the repository ML helpers. It is a public demo API, not a production financial-data service.

## Run locally

From the repository root:

```text
python -m pip install -r api/requirements.txt
uvicorn api.app.main:app --reload
```

`GET /health` returns the service status. The first implemented routes are CSV preview and savings-goal projection. CSV import accepts canonical headers: `date`, `description`, `amount`, `direction`, `bank`; optional headers are `account_alias`, `reference`, `currency`, and `time`.

## Supabase setup

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`, then run [`migrations/001_initial.sql`](migrations/001_initial.sql) in the Supabase SQL editor. The migration enables RLS and creates `commit_import`, a user-JWT-scoped RPC that atomically creates an import, its transactions, and duplicate candidates. The API never accepts a user ID from the client.

All rate limiting will be explicitly documented as demo-level when authenticated routes are added; no sensitive transaction fields are logged.
