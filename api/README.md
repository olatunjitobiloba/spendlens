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

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`, then apply [`migrations/001_initial.sql`](migrations/001_initial.sql) followed by [`migrations/002_rls_rpc_hardening.sql`](migrations/002_rls_rpc_hardening.sql) in the Supabase SQL editor (or migration runner). The API loads this root `.env` locally; Render supplies the same values as environment variables. The migrations enable RLS and create `commit_import`, a user-JWT-scoped RPC that atomically creates an import, its transactions, and duplicate candidates. The API never accepts a user ID from the client.

After applying them, run the real-project RLS regression check. It creates and removes two temporary Supabase auth users:

```powershell
$env:RUN_SUPABASE_INTEGRATION = '1'
pytest api/tests/test_supabase_rls_integration.py -q
```

Analysis and scenarios are calculated by Supabase RPCs with integer-kobo arithmetic. Pending duplicate candidates remain in totals; confirmed duplicate or internal-transfer links are excluded.

`DELETE /v1/imports/{id}` removes an import and its derived links. `DELETE /v1/me/data` removes financial data and retains billing records; it writes an audit event without transaction content.

All rate limiting will be explicitly documented as demo-level when authenticated routes are added; no sensitive transaction fields are logged.
