"""Environment-only configuration. Secrets are never read from requests."""

from dataclasses import dataclass
from functools import lru_cache
from os import getenv


@dataclass(frozen=True)
class Settings:
    supabase_url: str | None
    supabase_anon_key: str | None
    allowed_origin: str | None
    supabase_service_role_key: str | None = None
    kora_secret_key: str | None = None
    kora_public_key: str | None = None
    kora_price_kobo: int | None = None
    kora_amount_unit: str | None = None
    kora_webhook_url: str | None = None

    @property
    def supabase_ready(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)


@lru_cache
def get_settings() -> Settings:
    return Settings(
        supabase_url=getenv("SUPABASE_URL"),
        supabase_anon_key=getenv("SUPABASE_ANON_KEY"),
        supabase_service_role_key=getenv("SUPABASE_SERVICE_ROLE_KEY"),
        allowed_origin=getenv("ALLOWED_ORIGIN"),
        kora_secret_key=getenv("KORA_SECRET_KEY"),
        kora_public_key=getenv("KORA_PUBLIC_KEY"),
        kora_price_kobo=_integer_env("KORA_PRO_PRICE_KOBO"),
        kora_amount_unit=getenv("KORA_AMOUNT_UNIT"),
        kora_webhook_url=getenv("KORA_WEBHOOK_URL"),
    )


def _integer_env(name: str) -> int | None:
    value = getenv(name)
    return int(value) if value and value.isdigit() else None
