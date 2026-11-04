# SpendLens Day 7 Handoff: End-to-End Verification & API Smoke Testing

This document summarizes the end-to-end integration status, evaluation metrics, drill protocols, and third-party AI provider disclosures for the SpendLens v1 demonstration.

---

## 1. Live Evaluation Baseline (Day 5 & 6 Gate)

The explanation pipeline was evaluated across 20 synthetic scenarios (5 hand-crafted boundary fixtures + 15 generated edge cases):

- **Offline / Deterministic Check (`--fake`):** 100% pass rate (`pass_rate=1.000`, 0 fallbacks, 0 retries).
- **Live LLM Evaluation (`--min-pass 0.9`):** **100% pass rate** (`pass_rate=1.000`, `fallback_rate=0.000`, `check_fail_rate=0.000`, `error_rate=0.000`, `retry_rate=0.050`).
- **Observed Latency:** Median (p50) = 2,798 ms; 95th percentile (p95) = 10,375 ms.
- **Failover Verification:** High-concurrency runs triggering HTTP 429 rate limits on primary endpoints (Groq) automatically re-routed to secondary endpoints (Gemini) with zero failed user requests.

---

## 2. API Logging & Timing

[`ai/api.py`](../ai/api.py) logs every request with execution time:

```text
INFO:spendlens.ai:explain source=model ms=2415
```

If the model is slow, times out, or receives bad credentials, it falls back cleanly to the template and logs:

```text
INFO:spendlens.ai:explain source=template ms=12
```

> **Backend Configuration:** Ensure Render stdout displays `INFO` level logs. If using default Python logging, initialize `logging.basicConfig(level=logging.INFO)` in `api/main.py`.

---

## 3. Remote Smoke Testing Protocol

The automated smoke script [`scripts/smoke.py`](../scripts/smoke.py) validates the deployed endpoint against all 5 scenario fixtures.

### Usage
```bash
python scripts/smoke.py https://<RENDER_SERVICE_NAME>.onrender.com/v1/scenarios/explain
```

### Expected Output
```text
scenario_01.json: OK  source=model 1420ms 
scenario_02.json: OK  source=model 1180ms 
scenario_03.json: OK  source=model 1290ms 
scenario_04.json: OK  source=model 890ms 
scenario_05.json: OK  source=model 1540ms 
```

---

## 4. The Three Handoff Drills

Execute these three verification drills against the deployed Render backend:

| Drill | Action | Expected Behavior |
|---|---|---|
| **1. Normal** | Run `python scripts/smoke.py <ENDPOINT_URL>` on deployed backend. | Returns `OK` with `source=model` on all fixtures in < 4s. |
| **2. Bad Key** | In Render Dashboard, set `LLM_API_KEY=invalid_key_test`, trigger redeploy, and run smoke script. | Returns `OK` with `source=template` for all 5 fixtures. Zero uncaught 500 crashes. Render log shows `source=template`. Restore real keys immediately after. |
| **3. Cold Start** | Allow free-tier Render instance to idle for 15+ minutes. Run smoke script once. | Measure and record initial cold start response time (typically 30–50s). Confirm request completes without timing out. |

---

## 5. Frontend Contract Rules (for Fisayo)

1. **Decouple Scenario Numbers from AI Explanation:**  
   The frontend must render calculated spending totals and reduction numbers immediately. Fetch the AI explanation asynchronously as a secondary request so user interface interactions never wait on LLM generation.
2. **25-Second Timeout with Graceful Degradation:**  
   Set client-side `fetch` timeout for explanations to 25 seconds. If the model is delayed by a cold start or network stall, show the calculated figures without an explanation card. Never leave an infinite loading spinner.
3. **Sample Data Fallback:**  
   Provide a "Try with sample data" button on the import screen so judges and non-technical evaluators can test without preparing a CSV file.

---

## 6. Privacy & Third-Party AI Disclosure (for Gift)

Include the following facts in the privacy notice and pitch deck:

- **Third-Party Inference Providers:** Groq Inc. (Primary LPU inference) and Google LLC (Secondary Gemini API failover).
- **Zero Raw Financial Transmission:** The AI pipeline receives *only* high-level category totals, reduction percentages, and coverage warning strings (e.g. "Food: ₦12,000 cut"). Individual transaction lines, descriptions, merchant names, account balances, and identifiers are **never** transmitted to external AI providers.
- **Data Lifecycle:** User imported transactions remain stored in PostgreSQL until the user triggers account deletion via `DELETE /v1/me/data`.

