# ai/

Turns a validated scenario into a plain-language explanation.
Code calculates. AI only explains. No database, no storage.

## Use

```python
from ai.api import explain_scenario
result = explain_scenario(scenario_dict)
# {"text": str, "numbers_used": [int], "source": "model" | "template"}
```

Input is the scenario response (see `ai/schemas.py`, `fixtures/`).
All money is integer kobo. `remaining_kobo` must equal
`baseline_kobo - total_reduction_kobo`.

## FastAPI note

`explain_scenario` blocks while it waits for the model. Use a plain
`def` route, not `async def`, so it runs in a worker thread.
Return the scenario numbers first and call explain separately, so the
page never waits on the model.

## Install

`pip install pydantic httpx`. Add both to the backend requirements file.

## Environment variables (set in Render, never commit)

| Name | Required | Note |
|---|---|---|
| LLM_API_KEY | yes | |
| LLM_MODEL | yes | |
| LLM_BASE_URL | no | OpenAI-compatible endpoint. Default is OpenAI. |

## Failure behaviour

| Situation | Result |
|---|---|
| Model times out, errors, or returns bad JSON | `source: "template"`, no exception |
| Model output has a number not in the scenario | one retry, then `source: "template"` |
| Missing API key or model name | `source: "template"` every time, so log `source` |
| Payload missing a field or wrong type | raises `pydantic.ValidationError` |

Worst case is about 20 seconds (two calls, 10 second timeout each).
The timeout applies per stage, so it is not a hard cap.

## Data

The model receives totals, percentages, category names, protected
category names and coverage warnings. It never receives transaction
rows, descriptions or IDs. Do not log the payload.

## Check

`python -m ai.explain path/to/response.json`
Save one real response from your scenario endpoint and run this.
A pydantic error means the shapes differ.

## Tests and eval

`pytest` (offline), `python -m ai.eval --fake`, `python -m ai.eval`
