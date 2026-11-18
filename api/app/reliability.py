"""Demo-level request tracing, safe logs, and per-instance rate limits."""

import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from uuid import uuid4

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

log = logging.getLogger("spendlens.request")


def short_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:12]


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Adds an opaque request ID and logs only route metadata and hashed IDs."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        supplied = request.headers.get("X-Request-ID", "")
        request_id = supplied if 1 <= len(supplied) <= 64 and supplied.isascii() else uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        log.info(json.dumps({
            "event": "request_complete",
            "request_id": request_id,
            "route": request.url.path,
            "status": response.status_code,
            "latency_ms": round((time.perf_counter() - started) * 1000),
            "user_id_hash": getattr(request.state, "user_id_hash", None),
        }, separators=(",", ":")))
        return response


class InMemoryRateLimit:
    """Per-instance demo protection; reset on restart and not shared across hosts."""

    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def __call__(self, request: Request) -> None:
        identity = request.headers.get("authorization") or (request.client.host if request.client else "unknown")
        key = f"{request.url.path}:{short_hash(identity)}"
        now = time.monotonic()
        hits = self._hits[key]
        while hits and hits[0] <= now - self.window_seconds:
            hits.popleft()
        if len(hits) >= self.limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded", headers={"Retry-After": str(self.window_seconds)})
        hits.append(now)


import_limit = InMemoryRateLimit(limit=10)
explanation_limit = InMemoryRateLimit(limit=20)
order_limit = InMemoryRateLimit(limit=10)
