"""Kora order and webhook lifecycle. Webhooks are the entitlement authority."""

from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal, InvalidOperation
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .db import DatabaseError, SupabaseGateway, SupabaseServiceGateway
from .reliability import order_limit

router = APIRouter(prefix="/v1/billing", tags=["billing"])


class BillingOrder(BaseModel):
    id: str
    reference: str
    amount_kobo: int
    amount: int
    currency: str = "NGN"
    public_key: str
    notification_url: str
    reused: bool


def kora_amount_from_kobo(amount_kobo: int, unit: str | None) -> int:
    if unit == "kobo":
        return amount_kobo
    if unit == "naira":
        if amount_kobo % 100:
            raise ValueError("Kora naira unit requires a whole-naira price")
        return amount_kobo // 100
    raise ValueError("KORA_AMOUNT_UNIT must be kobo or naira")


def kobo_from_kora_amount(amount: object, unit: str | None) -> int:
    try:
        parsed = Decimal(str(amount))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("invalid Kora amount") from exc
    if unit == "kobo" and parsed == parsed.to_integral_value():
        return int(parsed)
    if unit == "naira":
        kobo = parsed * 100
        if kobo == kobo.to_integral_value():
            return int(kobo)
    raise ValueError("invalid Kora amount")


def kora_signature(data: dict, secret: str) -> str:
    # Mirrors JSON.stringify(data): compact separators and incoming key order.
    serialized = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    return hmac.new(secret.encode(), serialized.encode(), hashlib.sha256).hexdigest()


async def verify_charge(kora_reference: str, settings: Settings) -> dict:
    if not settings.kora_secret_key:
        raise ValueError("Kora is not configured")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"https://api.korapay.com/merchant/api/v1/charges/{kora_reference}",
                headers={"Authorization": f"Bearer {settings.kora_secret_key}"},
            )
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ValueError("Kora verification unavailable") from exc
    data = payload.get("data") if isinstance(payload, dict) else None
    if response.status_code >= 400 or not isinstance(data, dict):
        raise ValueError("Kora verification failed")
    return data


@router.post("/orders", response_model=BillingOrder, dependencies=[Depends(order_limit)])
async def create_order(
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=1, max_length=128),
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> BillingOrder:
    if not (settings.kora_price_kobo and settings.kora_public_key and settings.kora_webhook_url):
        raise HTTPException(status_code=503, detail="Billing is not configured")
    try:
        amount = kora_amount_from_kobo(settings.kora_price_kobo, settings.kora_amount_unit)
        result = await SupabaseGateway(settings, user.token).rpc(
            "create_billing_order",
            {"p_reference": f"sl_{uuid4().hex}", "p_amount_kobo": settings.kora_price_kobo, "p_idempotency_key": idempotency_key},
        )
    except (DatabaseError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Could not create order") from exc
    return BillingOrder.model_validate({
        **result, "amount": amount, "public_key": settings.kora_public_key,
        "notification_url": settings.kora_webhook_url,
    })


@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        result = await SupabaseGateway(settings, user.token).rpc("get_billing_order", {"p_order_id": order_id})
    except DatabaseError as exc:
        raise HTTPException(status_code=404, detail="Order not found") from exc
    if not isinstance(result, dict):
        raise HTTPException(status_code=404, detail="Order not found")
    return result


@router.post("/kora/webhook")
async def kora_webhook(request: Request, x_korapay_signature: str | None = Header(default=None)) -> dict:
    settings = get_settings()
    if not settings.kora_secret_key or not x_korapay_signature:
        raise HTTPException(status_code=401, detail="Invalid webhook")
    try:
        payload = json.loads(await request.body())
        data = payload["data"]
        if not isinstance(data, dict) or not hmac.compare_digest(kora_signature(data, settings.kora_secret_key), x_korapay_signature):
            raise ValueError("signature")
        order_reference = data.get("payment_reference") or data.get("reference")
        kora_reference = data.get("reference")
        if not isinstance(order_reference, str) or not isinstance(kora_reference, str):
            raise ValueError("reference")
        verified = await verify_charge(kora_reference, settings)
        if verified.get("reference") != kora_reference:
            raise ValueError("reference")
        if verified.get("currency") != "NGN":
            raise ValueError("currency")
        amount_kobo = kobo_from_kora_amount(verified.get("amount_paid", verified.get("amount")), settings.kora_amount_unit)
    except (KeyError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid webhook")
    event_hash = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    try:
        return await SupabaseServiceGateway(settings).rpc("process_kora_event", {
            "p_event_hash": event_hash, "p_event_type": payload.get("event"),
            "p_order_reference": order_reference, "p_amount_kobo": amount_kobo,
            "p_currency": verified["currency"], "p_status": verified.get("status"),
            "p_transaction_status": data.get("transaction_status"),
        })
    except DatabaseError as exc:
        raise HTTPException(status_code=502, detail="Webhook processing failed") from exc
