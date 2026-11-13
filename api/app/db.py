"""Small Supabase REST/RPC client used with the caller's JWT for RLS."""

from __future__ import annotations

from typing import Any

import httpx

from .config import Settings


class DatabaseError(RuntimeError):
    pass


class SupabaseGateway:
    def __init__(self, settings: Settings, token: str) -> None:
        if not settings.supabase_ready:
            raise DatabaseError("Supabase is not configured")
        self._base_url = settings.supabase_url.rstrip("/")  # type: ignore[union-attr]
        self._headers = {
            "apikey": settings.supabase_anon_key or "",
            "Authorization": f"Bearer {token}",
        }

    async def current_user(self) -> dict[str, Any]:
        return await self._request("GET", "/auth/v1/user")

    async def rpc(self, function: str, payload: dict[str, Any]) -> Any:
        return await self._request("POST", f"/rest/v1/rpc/{function}", json=payload)

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.request(
                    method,
                    f"{self._base_url}{path}",
                    headers=self._headers,
                    **kwargs,
                )
        except httpx.HTTPError as exc:
            raise DatabaseError("Supabase request failed") from exc
        if response.status_code >= 400:
            raise DatabaseError("Supabase rejected the request")
        return response.json() if response.content else None
