BANKS = {
    "opay": "opay",
    "gtbank": "gtbank",
    "gtb": "gtbank",
    "guaranty trust": "gtbank",
    "ecobank": "ecobank",
    "access": "access",
    "access bank": "access",
    "acces bank": "access",
}


def normalize_bank(raw: str | None) -> str:
    key = (raw or "").strip().lower()
    return BANKS.get(key, "other")
