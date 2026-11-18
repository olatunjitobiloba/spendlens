# SpendLens API

FastAPI backend for SpendLens. It accepts synthetic transaction CSVs and supported text-based PDF statements, performs deterministic calculations, and calls the repository ML helpers. It is a public demo API, not a production financial-data service.

## Run locally

From the repository root:

```text
python -m pip install -r api/requirements.txt
uvicorn api.app.main:app --reload
```

`GET /health` returns the service status. CSV import accepts canonical headers: `date`, `description`, `amount`, `direction`, `bank`; optional headers are `account_alias`, `reference`, `currency`, and `time`. PDF support is intentionally limited to readable, text-native PDFs containing that same comma-delimited canonical table. Scanned, encrypted, and bank-layout-specific PDFs are rejected; SpendLens never asks for a document or banking password.

## Supabase setup

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`, then apply [`migrations/001_initial.sql`](migrations/001_initial.sql), [`migrations/002_rls_rpc_hardening.sql`](migrations/002_rls_rpc_hardening.sql), and [`migrations/003_scenarios_and_explanations.sql`](migrations/003_scenarios_and_explanations.sql) in order. The API loads this root `.env` locally; Render supplies the same values as environment variables. The migrations enable RLS and create user-JWT-scoped RPCs. The API never accepts a user ID from the client.

After applying them, run the real-project RLS regression check. It creates and removes two temporary Supabase auth users:

```powershell
$env:RUN_SUPABASE_INTEGRATION = '1'
pytest api/tests/test_supabase_rls_integration.py -q
```

Analysis and scenarios are calculated by Supabase RPCs with integer-kobo arithmetic. Pending duplicate candidates remain in totals; confirmed duplicate or internal-transfer links are excluded.

`DELETE /v1/imports/{id}` removes an import and its derived links. `DELETE /v1/me/data` removes financial data and retains billing records; it writes an audit event without transaction content.

Import, explanation, and billing-order endpoints use an in-memory per-instance rate limiter. It is demo-level only: limits reset on restart and are not shared across deployed instances. Every response includes an opaque `X-Request-ID`; structured request logs contain only route, status, latency, request ID, and a hashed user ID—never transaction descriptions, account details, or CSV content.

## Deploy

Build the container from the repository root with `docker build -f api/Dockerfile -t spendlens-api .`, then run it with `-p 8000:8000`. The process uses the host-provided `PORT` (or `8000` locally). [`../render.yaml`](../render.yaml) is a Render Blueprint; set its `sync: false` values in the Render dashboard and use only the Vercel frontend origin for `ALLOWED_ORIGIN`. After deployment, verify the public `GET /health` endpoint with `python scripts/smoke_deploy.py https://<service>.onrender.com`.
