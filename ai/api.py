from ai.explain import explain
from ai.llm import complete
from ai.schemas import ScenarioResult


def explain_scenario(payload: dict, llm=complete) -> dict:
    """JSON in, JSON out. The only function the API should call.

    Bad input raises pydantic.ValidationError (a backend bug).
    Model problems never raise. They return source="template".
    """
    scenario = ScenarioResult.model_validate(payload)
    return explain(scenario, llm=llm).model_dump()

