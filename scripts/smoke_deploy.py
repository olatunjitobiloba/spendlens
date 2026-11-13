"""Deployment smoke check for the SpendLens backend /health endpoint."""

from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request


def check_health(base_url: str, timeout: float = 90.0) -> dict:
    """Request GET <base_url>/health and verify HTTP 200 with status=='ok'."""
    parsed = urllib.parse.urlparse(base_url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError(f"Invalid http/https base URL: {base_url!r}")

    clean_path = parsed.path.rstrip("/")
    if clean_path.endswith("/health"):
        clean_path = clean_path[: -len("/health")]
    target = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, f"{clean_path}/health", "", "", ""))
    req = urllib.request.Request(target, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # nosec B310 - scheme checked above
        if resp.status != 200:
            raise AssertionError(f"Unexpected status {resp.status} from {target}")
        data = json.loads(resp.read().decode("utf-8"))

    if not isinstance(data, dict) or data.get("status") != "ok":
        raise AssertionError(f"Unexpected health payload from {target}: {data!r}")
    return data


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint for checking a deployed backend health endpoint."""
    args = sys.argv[1:] if argv is None else argv
    if len(args) != 1:
        print("Usage: python scripts/smoke_deploy.py <BACKEND_URL>")
        return 2

    try:
        check_health(args[0])
    except Exception as exc:
        print(f"backend check failed: {exc}", file=sys.stderr)
        return 1

    print("backend ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
