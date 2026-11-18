"""Live RLS regression tests.  They never run unless explicitly enabled.

Run after applying migrations with:
  RUN_SUPABASE_INTEGRATION=1 pytest api/tests/test_supabase_rls_integration.py -q
"""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass, field
from pathlib import Path

import httpx
import pytest
from dotenv import load_dotenv


# Match the API's local-development convention while allowing deployment and CI
# to provide the same values as process environment variables.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_SUPABASE_INTEGRATION") != "1",
    reason="set RUN_SUPABASE_INTEGRATION=1 to exercise the configured Supabase project",
)


@dataclass
class UserSession:
    user_id: str
    access_token: str


@dataclass(frozen=True)
class SupabaseConfig:
    url: str
    anon_key: str = field(repr=False)
    service_key: str = field(repr=False)


@pytest.fixture(scope="module")
def supabase_config() -> SupabaseConfig:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    anon_key = os.getenv("SUPABASE_ANON_KEY", "")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not all((url, anon_key, service_key)):
        pytest.fail("SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required")
    return SupabaseConfig(url=url, anon_key=anon_key, service_key=service_key)


def _create_user(client: httpx.Client, url: str, service_key: str) -> UserSession:
    email = f"rls-{secrets.token_hex(12)}@example.invalid"
    password = secrets.token_urlsafe(24)
    admin_headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
    created = client.post(
        f"{url}/auth/v1/admin/users",
        headers=admin_headers,
        json={"email": email, "password": password, "email_confirm": True},
    )
    created.raise_for_status()
    user_id = created.json()["id"]
    token = client.post(
        f"{url}/auth/v1/token?grant_type=password",
        headers={"apikey": service_key},
        json={"email": email, "password": password},
    )
    token.raise_for_status()
    return UserSession(user_id=user_id, access_token=token.json()["access_token"])


def _headers(anon_key: str, token: str, *, representation: bool = False) -> dict[str, str]:
    headers = {"apikey": anon_key, "Authorization": f"Bearer {token}"}
    if representation:
        headers["Prefer"] = "return=representation"
    return headers


def test_users_cannot_read_or_change_each_others_accounts(supabase_config: SupabaseConfig) -> None:
    url = supabase_config.url
    anon_key = supabase_config.anon_key
    service_key = supabase_config.service_key
    with httpx.Client(timeout=15) as client:
        owner = _create_user(client, url, service_key)
        other = _create_user(client, url, service_key)
        try:
            created = client.post(
                f"{url}/rest/v1/accounts",
                headers=_headers(anon_key, owner.access_token, representation=True),
                json={"user_id": owner.user_id, "alias": "Owner account", "currency": "NGN"},
            )
            created.raise_for_status()
            account_id = created.json()[0]["id"]

            invisible = client.get(
                f"{url}/rest/v1/accounts",
                headers=_headers(anon_key, other.access_token),
                params={"id": f"eq.{account_id}", "select": "id,user_id,alias"},
            )
            invisible.raise_for_status()
            assert invisible.json() == []

            cross_user_insert = client.post(
                f"{url}/rest/v1/accounts",
                headers=_headers(anon_key, other.access_token),
                json={"user_id": owner.user_id, "alias": "forbidden", "currency": "NGN"},
            )
            assert cross_user_insert.status_code in {401, 403}

            changed = client.patch(
                f"{url}/rest/v1/accounts",
                headers=_headers(anon_key, other.access_token, representation=True),
                params={"id": f"eq.{account_id}"},
                json={"alias": "tampered"},
            )
            changed.raise_for_status()
            assert changed.json() == []

            owner_view = client.get(
                f"{url}/rest/v1/accounts",
                headers=_headers(anon_key, owner.access_token),
                params={"id": f"eq.{account_id}", "select": "alias"},
            )
            owner_view.raise_for_status()
            assert owner_view.json() == [{"alias": "Owner account"}]
        finally:
            admin_headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
            for user in (owner, other):
                client.delete(f"{url}/auth/v1/admin/users/{user.user_id}", headers=admin_headers)
