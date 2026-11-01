import logging
import os

import httpx

log = logging.getLogger("ai")


def _call_provider(
    base_url: str,
    api_key: str,
    model: str,
    system: str,
    user: str,
    timeout: float = 10.0,
) -> str:
    """Helper to call any OpenAI-compatible chat completions endpoint."""
    r = httpx.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=timeout,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def complete(system: str, user: str, timeout: float = 10.0) -> str:
    """One model call with failover routing.

    1. Tries Groq (high-speed primary) if GROQ_API_KEY is configured.
    2. Falls back to Gemini (high-quota secondary) on error or rate-limit.
    3. Falls back to standard LLM_API_KEY / LLM_BASE_URL if neither is set.
    """
    # 1. Try Groq (Primary)
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        try:
            return _call_provider(
                base_url="https://api.groq.com/openai/v1",
                api_key=groq_key,
                model=groq_model,
                system=system,
                user=user,
                timeout=timeout,
            )
        except Exception as e:
            log.warning(
                "Primary LLM (Groq) failed with %s: %s; falling back to Gemini...",
                type(e).__name__,
                e,
            )

    # 2. Try Gemini (Secondary / Fallback)
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        try:
            return _call_provider(
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                api_key=gemini_key,
                model=gemini_model,
                system=system,
                user=user,
                timeout=timeout,
            )
        except Exception as e:
            log.warning(
                "Secondary LLM (Gemini) failed with %s: %s",
                type(e).__name__,
                e,
            )

    # 3. Fall back to generic OpenAI-compatible configuration if present
    if "LLM_API_KEY" in os.environ:
        return _call_provider(
            base_url=os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1"),
            api_key=os.environ["LLM_API_KEY"],
            model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
            system=system,
            user=user,
            timeout=timeout,
        )

    raise KeyError(
        "No LLM API keys configured. Set GROQ_API_KEY, GEMINI_API_KEY, or LLM_API_KEY."
    )
