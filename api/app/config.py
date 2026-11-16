"""Environment-only configuration. Secrets are never read from requests."""

from dataclasses import dataclass
from functools import lru_cache
from os import getenv


@dataclass(frozen=True)
class Settings:
    supabase_url: str | None
    supabase_anon_key: str | None
    allowed_origin: str | None
    allowed_origin_regex: str | None = None

    @property
    def supabase_ready(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)

    @property
    def allowed_origins(self) -> list[str]:
        if not self.allowed_origin:
            return []
        return [o.strip() for o in self.allowed_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        supabase_url=getenv("SUPABASE_URL"),
        supabase_anon_key=getenv("SUPABASE_ANON_KEY"),
        allowed_origin=getenv("ALLOWED_ORIGIN"),
        allowed_origin_regex=getenv("ALLOWED_ORIGIN_REGEX"),
    )
