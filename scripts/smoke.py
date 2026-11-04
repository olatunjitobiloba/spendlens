import json
import sys
import time
from pathlib import Path

import httpx

FIXTURES = sorted((Path(__file__).parent.parent / "fixtures").glob("scenario_*.json"))


def main(url: str) -> int:
    bad = 0
    for path in FIXTURES:
        body = json.loads(path.read_text(encoding="utf-8"))
        start = time.perf_counter()
        try:
            r = httpx.post(url, json=body, timeout=60)
            r.raise_for_status()
            out = r.json()
            ok = bool(out.get("text")) and out.get("source") in ("model", "template")
        except Exception as e:
            out, ok = {"error": type(e).__name__}, False
        ms = int((time.perf_counter() - start) * 1000)
        print(
            f"{path.name}: {'OK ' if ok else 'BAD'} source={out.get('source')} {ms}ms {out.get('error', '')}"
        )
        bad += not ok
    return 1 if bad else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/smoke.py <ENDPOINT_URL>")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))

