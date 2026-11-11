from typing import Literal

from pydantic import AliasChoices, BaseModel, Field, field_validator

from ai.banks import normalize_bank


class Txn(BaseModel):
    id: str | int | None = None
    description: str
    amount_kobo: int = Field(gt=0)
    date: str = Field(validation_alias=AliasChoices("date", "txn_date"))
    direction: Literal["debit", "credit"] = "debit"
    bank: str = "other"
    account_alias: str | None = Field(
        default=None,
        validation_alias=AliasChoices("account_alias", "account"),
    )
    reference: str | None = None

    @field_validator("bank", mode="before")
    @classmethod
    def clean_bank(cls, v):
        return normalize_bank(v)


class DateRange(BaseModel):
    start: str
    end: str


class CategoryRow(BaseModel):
    category: str
    total_kobo: int = Field(ge=0)
    percent: int = Field(ge=0, le=100)
    reduction_kobo: int = Field(ge=0)


class ScenarioResult(BaseModel):
    """Input to explain(). Produced by the backend, never by AI."""

    data_revision: str
    range: DateRange
    baseline_kobo: int = Field(ge=0)
    categories: list[CategoryRow]
    total_reduction_kobo: int = Field(ge=0)
    remaining_kobo: int = Field(ge=0)
    protected_categories: list[str]
    coverage_warnings: list[str] = []
    evidence_txn_ids: list[str] = []


class Explanation(BaseModel):
    """Output of explain(). numbers_used are kobo integers from the scenario."""

    text: str
    numbers_used: list[int]
    source: Literal["model", "template"] = "model"
