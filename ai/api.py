import logging
import time

from pydantic import BaseModel, Field, field_validator

from ai.chat import chat
from ai.explain import explain
from ai.llm import complete
from ai.schemas import ScenarioResult

log = logging.getLogger("spendlens.ai")

CTX_KEYS = {
    "baseline_kobo",
    "total_reduction_kobo",
    "remaining_kobo",
    "categories",
    "protected",
    "cuts",
}


class ChatIn(BaseModel):
    ctx: dict
    message: str = Field(min_length=1, max_length=500)
    history: list[dict] = Field(default_factory=list, max_length=6)

    @field_validator("ctx")
    @classmethod
    def ctx_has_keys(cls, v):
        if isinstance(v, dict) and isinstance(v.get("categories"), list):
            from ai.chat_tools import make_chat_context

            v = make_chat_context(v)
        missing = CTX_KEYS - v.keys()
        if missing:
            raise ValueError(f"ctx missing: {sorted(missing)}")
        return v


def explain_scenario(payload: dict, llm=complete) -> dict:
    """JSON in, JSON out. The only function the API should call.

    Bad input raises pydantic.ValidationError (a backend bug).
    Model problems never raise. They return source="template".
    """
    scenario = ScenarioResult.model_validate(payload)
    start = time.perf_counter()
    result = explain(scenario, llm=llm).model_dump()
    ms = int((time.perf_counter() - start) * 1000)
    log.info("explain source=%s ms=%d", result["source"], ms)
    return result


def chat_reply(payload: dict, llm=complete) -> dict:
    req = ChatIn.model_validate(payload)  # bad input raises, as in explain_scenario
    start = time.monotonic()
    out = chat(req.ctx, req.message, req.history, llm=llm)
    log.info(
        "chat source=%s calls=%s ms=%d",
        out["source"],
        out["tool_calls"],
        int((time.monotonic() - start) * 1000),
    )  # never log the message
    return out


