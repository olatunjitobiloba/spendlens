from fastapi import APIRouter, Depends, HTTPException

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway

router = APIRouter(prefix="/v1/me", tags=["privacy"])


@router.delete("/data")
async def delete_my_data(
    user: CurrentUser = Depends(get_current_user), settings: Settings = Depends(get_settings)
) -> dict:
    try:
        return await SupabaseGateway(settings, user.token).rpc("delete_my_data", {})
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Could not delete data") from exc
