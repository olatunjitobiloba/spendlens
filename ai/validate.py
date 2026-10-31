import re
from decimal import Decimal

from ai.schemas import ScenarioResult

# optional prefix, number, optional suffix (percent, "naira", or k/m/b abbreviation)
NUM = re.compile(
    r"(₦|NGN\s?)?(\d+(?:,\d{3})*(?:\.\d+)?)(\s?%|\s?naira\b|[kmb]\b)?",
    re.IGNORECASE,
)


def fmt_naira(kobo: int) -> str:
    """Format integer kobo as naira text, e.g. 1200000 -> ₦12,000."""
    naira, rem = divmod(kobo, 100)
    return f"₦{naira:,}.{rem:02d}" if rem else f"₦{naira:,}"


def _to_kobo(token: str):
    k = Decimal(token.replace(",", "")) * 100
    return int(k) if k == k.to_integral_value() else None


def _allowed(s: ScenarioResult):
    money = {0, s.baseline_kobo, s.total_reduction_kobo}
    for c in s.categories:
        money |= {c.total_kobo, c.reduction_kobo}
    percents = {c.percent for c in s.categories}
    plain = set()
    for chunk in [s.range.start, s.range.end, *s.coverage_warnings]:
        plain |= {int(x) for x in re.findall(r"\d+", chunk)}
    return money, percents, plain


def validate(
    text: str,
    scenario: ScenarioResult,
    numbers_used: list[int] | None = None,
) -> list[str]:
    """Return a list of errors. An empty list means the text is valid."""
    money, percents, plain = _allowed(scenario)
    errors = []

    for m in NUM.finditer(text):
        prefix, num, suffix = m.group(1), m.group(2), (m.group(3) or "").strip().lower()
        if suffix in {"k", "m", "b"}:
            errors.append(f"abbreviated number not allowed: {m.group(0)!r}")
        elif suffix == "%":
            if "." in num or int(num) not in percents:
                errors.append(f"percent not in scenario: {num}%")
        elif prefix or suffix == "naira":
            kobo = _to_kobo(num)
            if kobo is None or kobo not in money:
                errors.append(f"amount not in scenario: {m.group(0)!r}")
        elif "." in num or int(num.replace(",", "")) not in plain:
            errors.append(f"number not in scenario: {num}")

    for n in numbers_used or []:
        if n not in money:
            errors.append(f"numbers_used contains unknown value: {n}")

    return errors
