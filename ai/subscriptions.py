"""Agentic subscription detection and cancellation metadata.

Identifies repeating software, entertainment, and utility charges and equips the
user with one-click direct cancellation links and pre-filled cancellation email drafts.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ai.recurring import find_recurring


@dataclass(frozen=True)
class SubscriptionItem:
    merchant: str
    monthly_kobo: int
    annual_kobo: int
    frequency_days: int
    cancellation_url: str | None
    cancellation_email_template: str


KNOWN_SUBSCRIPTION_PORTALS: dict[str, str] = {
    "netflix": "https://www.netflix.com/youraccount",
    "spotify": "https://www.spotify.com/account/subscription",
    "apple": "https://support.apple.com/billing",
    "itunes": "https://support.apple.com/billing",
    "google": "https://play.google.com/store/account/subscriptions",
    "youtube": "https://www.youtube.com/paid_memberships",
    "dstv": "https://www.dstv.com/en-ng/self-service",
    "showmax": "https://www.showmax.com/settings",
    "amazon": "https://www.amazon.com/mc/manage",
    "prime": "https://www.amazon.com/mc/manage",
    "gym": "mailto:support?subject=Subscription%20Cancellation",
    "canva": "https://www.canva.com/settings/billing-and-teams",
    "chatgpt": "https://chatgpt.com/#settings/Subscription",
    "openai": "https://chatgpt.com/#settings/Subscription",
}


def _match_portal(merchant: str) -> str | None:
    norm = merchant.lower()
    for key, url in KNOWN_SUBSCRIPTION_PORTALS.items():
        if key in norm:
            return url
    return None


def _build_cancellation_email(merchant: str, amount_kobo: int) -> str:
    amount_naira = amount_kobo / 100
    return (
        f"Subject: Notice of Cancellation - Account Recurring Charge ({merchant})\n\n"
        f"Dear Support Team,\n\n"
        f"I am writing to formally request the cancellation of my subscription for {merchant} "
        f"(recurring billing of ₦{amount_naira:,.2f}), effective immediately.\n\n"
        f"Please confirm receipt of this cancellation and ensure no further debits occur.\n\n"
        f"Thank you,\nSpendLens Account Holder"
    )


def scan_subscriptions(txns: list[dict[str, Any]]) -> list[SubscriptionItem]:
    """Scans transactions for repeating subscriptions and equips them with cancellation aids."""
    repeating = find_recurring(txns)
    results: list[SubscriptionItem] = []

    for item in repeating:
        merchant = item.get("merchant") or item.get("merchant_key") or "Unknown Merchant"
        amount_kobo = item.get("amount_kobo", 0)
        period_days = item.get("period_days", 30)

        # Normalize to monthly (30 days) for annual projection
        if period_days == 7:
            monthly_kobo = amount_kobo * 4
        elif period_days == 14:
            monthly_kobo = amount_kobo * 2
        else:
            monthly_kobo = amount_kobo

        annual_kobo = monthly_kobo * 12
        portal_url = _match_portal(merchant)
        email_template = _build_cancellation_email(merchant, monthly_kobo)

        results.append(
            SubscriptionItem(
                merchant=merchant.title(),
                monthly_kobo=monthly_kobo,
                annual_kobo=annual_kobo,
                frequency_days=period_days,
                cancellation_url=portal_url,
                cancellation_email_template=email_template,
            )
        )

    # Sort descending by annual cost to highlight the biggest savings opportunities first
    results.sort(key=lambda x: x.annual_kobo, reverse=True)
    return results
