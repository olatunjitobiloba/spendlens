# SpendLens API

FastAPI backend for SpendLens. It accepts synthetic transaction CSVs, performs deterministic calculations, and calls the repository ML helpers. It is a public demo API, not a production financial-data service.

## Run locally

From the repository root:

```text
python -m pip install -r api/requirements.txt
uvicorn api.app.main:app --reload
```

`GET /health` returns the service status. The first implemented routes are CSV preview and savings-goal projection. CSV import accepts canonical headers: `date`, `description`, `amount`, `direction`, `bank`; optional headers are `account_alias`, `reference`, `currency`, and `time`.

All rate limiting will be explicitly documented as demo-level when authenticated routes are added; no sensitive transaction fields are logged.
