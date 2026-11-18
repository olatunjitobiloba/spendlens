"""Request authentication through Supabase; the token supplies the user ID."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway
from .reliability import short_hash

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    token: str


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer token required")
    try:
        payload = await SupabaseGateway(settings, credentials.credentials).current_user()
    except DatabaseError as exc:
        status = 503 if not settings.supabase_ready else 401
        raise HTTPException(status_code=status, detail="Invalid or unavailable authentication") from exc
    user_id = payload.get("id")
    if not isinstance(user_id, str):
        raise HTTPException(status_code=401, detail="Invalid authentication")
    request.state.user_id_hash = short_hash(user_id)
    return CurrentUser(id=user_id, token=credentials.credentials)
