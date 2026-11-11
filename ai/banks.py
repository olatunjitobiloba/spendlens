BANKS = {
    "opay": "opay",
    "paycom": "opay",
    "gtbank": "gtbank",
    "gtb": "gtbank",
    "guaranty trust": "gtbank",
    "guaranty trust bank": "gtbank",
    "guaranty-trust-bank": "gtbank",
    "ecobank": "ecobank",
    "ecobank-nigeria": "ecobank",
    "access": "access",
    "access bank": "access",
    "acces bank": "access",
    "access-bank": "access",
    "zenith": "zenith",
    "zenith bank": "zenith",
    "zenith-bank": "zenith",
}


def normalize_bank(raw: str | None) -> str:
    key = (raw or "").strip().lower()
    return BANKS.get(key, "other")
