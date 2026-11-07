from ai.chat_eval import run_eval


def test_offline_eval_passes():
    rep = run_eval()
    assert rep["answerable_pass"] == 1.0
    assert rep["answerable_refused"] == 0.0
    assert rep["safe_pass"] == 1.0


def test_broken_model_fails_the_eval():
    rep = run_eval(llm=lambda s, u: "not json")
    assert rep["answerable_pass"] == 0.0
    assert rep["answerable_refused"] == 1.0
