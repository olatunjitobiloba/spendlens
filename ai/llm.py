import os

import httpx


def complete(system: str, user: str, timeout: float = 10.0) -> str:
    """One model call. Returns the raw text. Raises on any failure."""
    base = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1")
    r = httpx.post(
        f"{base}/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['LLM_API_KEY']}"},
        json={
            "model": os.environ["LLM_MODEL"],
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
