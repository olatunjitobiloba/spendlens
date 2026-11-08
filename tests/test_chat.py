import json
from pathlib import Path

from ai.chat import REFUSAL, chat
from tests.test_chat_tools import CTX


def scripted(*replies):
    it = iter(replies)
    return lambda system, user: next(it)


def j(**kw):
    return json.dumps(kw)


def test_tool_then_grounded_answer():
    llm = scripted(j(tool="get_summary", args={}), j(answer="You would keep ₦95,500.00 after savings."))
    out = chat(CTX, "what is left?", llm=llm)
    assert out["source"] == "model" and out["tool_calls"] == 1


def test_invented_number_is_refused():
    llm = scripted(j(tool="get_summary", args={}), j(answer="You would save 12345 naira."))
    assert chat(CTX, "x", llm=llm)["answer"] == REFUSAL


def test_answer_without_tools_cannot_cite_numbers():
    assert chat(CTX, "x", llm=scripted(j(answer="You have ₦500,000.")))["source"] == "refusal"


def test_endless_tool_calls_stop_at_budget():
    llm = lambda s, u: j(tool="get_summary", args={})
    out = chat(CTX, "x", llm=llm)
    assert out["source"] == "refusal" and out["tool_calls"] == 4


def test_bad_json_and_provider_error_are_refused():
    assert chat(CTX, "x", llm=scripted("not json"))["source"] == "refusal"

    def boom(s, u):
        raise TimeoutError

    assert chat(CTX, "x", llm=boom)["source"] == "refusal"


def test_unknown_tool_is_harmless():
    llm = scripted(j(tool="delete_everything"), j(answer="I can't check that."))
    assert chat(CTX, "x", llm=llm)["source"] == "model"


def test_fenced_json_is_accepted():
    fenced = "```json\n" + j(tool="get_summary", args={}) + "\n```"
    llm = scripted(fenced, j(answer="You would keep ₦95,500.00 after savings."))
    assert chat(CTX, "x", llm=llm)["source"] == "model"


def test_markdown_fence_json_is_parsed():
    fenced = "```json\n" + j(answer="I can't check that.") + "\n```"
    assert chat(CTX, "x", llm=scripted(fenced))["source"] == "model"


def test_answer_over_80_words_is_refused():
    long_text = "word " * 85
    assert chat(CTX, "x", llm=scripted(j(answer=long_text)))["source"] == "refusal"


def test_chat_with_scenario_fixture():
    fixture_path = Path(__file__).parent.parent / "fixtures" / "scenario_01.json"
    scenario = json.loads(fixture_path.read_text())
    llm = scripted(
        j(tool="get_category", args={"name": "Food"}),
        j(answer="Food spending is ₦60,000 with a planned cut of 20%."),
    )
    out = chat(scenario, "how much on food?", llm=llm)
    assert out["source"] == "model"
    assert out["tool_calls"] == 1


def test_partial_number_is_refused():
    llm = scripted(j(tool="get_summary", args={}), j(answer="You would keep 5 naira."))
    assert chat(CTX, "x", llm=llm)["source"] == "refusal"


def test_comma_and_missing_decimals_are_accepted():
    llm = scripted(j(tool="get_summary", args={}), j(answer="You keep ₦95,500, which is enough."))
    assert chat(CTX, "x", llm=llm)["source"] == "model"


