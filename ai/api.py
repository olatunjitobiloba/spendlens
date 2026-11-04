import logging
import time

from ai.explain import explain
from ai.llm import complete
from ai.schemas import ScenarioResult

log = logging.getLogger("spendlens.ai")


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

