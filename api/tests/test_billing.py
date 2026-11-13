from api.app.billing import kobo_from_kora_amount, kora_amount_from_kobo, kora_signature


def test_kora_amount_conversion_requires_explicit_unit():
    assert kora_amount_from_kobo(25_000, "kobo") == 25_000
    assert kora_amount_from_kobo(25_000, "naira") == 250
    assert kobo_from_kora_amount("250", "naira") == 25_000


def test_kora_signature_is_compact_data_only_json():
    data = {"reference": "KPY-1", "amount": 250}

    assert kora_signature(data, "secret") == "84e37f4f1564cd00c29bac18b9805a6ecb75a4ca87cec06ebd1e6e63628abdbf"
