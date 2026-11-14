from pydantic import BaseModel, Field

MAX_MONTHS = 600  # 50 years cap


class GoalInput(BaseModel):
    goal_name: str = Field(min_length=1, max_length=60)
    target_kobo: int = Field(gt=0)
    saved_kobo: int = Field(ge=0)
    monthly_saving_kobo: int = Field(ge=0)
    annual_rate_pct: float = Field(default=0.0, ge=0, le=100)  # user-entered assumption


class GoalProjection(BaseModel):
    goal_name: str
    months_to_goal: int | None  # None = not reached within 50 years
    final_balance_kobo: int
    annual_rate_pct: float
    note: str


def project_goal(g: GoalInput) -> GoalProjection:
    monthly_rate = g.annual_rate_pct / 100 / 12
    balance = g.saved_kobo
    months = 0 if balance >= g.target_kobo else None

    if months is None:
        for m in range(1, MAX_MONTHS + 1):
            balance = round(balance * (1 + monthly_rate)) + g.monthly_saving_kobo
            if balance >= g.target_kobo:
                months = m
                break

    return GoalProjection(
        goal_name=g.goal_name,
        months_to_goal=months,
        final_balance_kobo=balance,
        annual_rate_pct=g.annual_rate_pct,
        note="Projection uses the rate you entered. It is an assumption, not a forecast or advice.",
    )
