# Task 2 Report

## Status

Implemented sequential evaluation in `ai/eval.py` and focused fakes in
`tests/test_eval.py`. The implementation preserves Task 1 generation and
checks, runs cases sequentially, records mutually exclusive outcomes,
captures provider exception types, counts calls and retries, falls back to
the template through `explain()`, and aggregates rates and latency
percentiles. CLI parsing and report-file writing were intentionally left for
Task 3.

## Commit hashes

- Task 1 baseline: `8ef3657`
- Task 2 implementation and tests: `cc2053bebbfe5b047a902b5d6131b4f4e3a51f04`

## Tests run

```text
pytest tests/test_eval.py -q
11 passed in 0.42s

pytest tests/test_explain.py tests/test_validate.py tests/test_eval.py -q
37 passed in 0.44s

pytest -q
45 passed in 0.44s
```

## Self-review and security review

- Reviewed the changed diff for outcome contracts, exception boundaries,
  sequential execution, metadata fallback, and report secret exposure.
- No API keys, provider URLs, or user credentials are written to reports.
- Git SHA lookup uses a fixed argument list and returns `unknown` on failure.
- No new input-facing endpoint or persistence path was introduced.

## Concerns

- Retry rate intentionally excludes rows that ultimately use the template
  fallback, matching the Task 2 fallback expectation (`retry_rate == 0` for
  an all-fallback fake) while retaining per-row call counts.
- CLI preflight, fake/live defaults, and JSON report writing remain Task 3
  work.

## Review fix

The review identified that `retry_rate` incorrectly excluded rows that ended
in fallback. The aggregation now counts every row with `calls > 1`,
regardless of outcome. The fallback regression test now expects a retry rate
of `1`.

Fix commit: final commit containing this report (see repository `HEAD`).

Tests after fix:

```text
pytest tests/test_eval.py -q
11 passed in 0.45s

pytest -q
45 passed in 0.46s
```

The prior retry-rate concern is superseded by this correction.
