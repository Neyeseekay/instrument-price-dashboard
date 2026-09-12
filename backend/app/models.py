"""Pydantic response models.

JSON is camelCase (via `alias_generator`) so the generated TypeScript
client reads naturally on the frontend; Python code still reads/writes
snake_case internally.
"""

from datetime import date

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PricePointOut(ApiModel):
    date: date
    price: float


class PriceSeriesOut(ApiModel):
    ticker: str
    series: list[PricePointOut]


class StatsOut(ApiModel):
    ticker: str
    total_return_pct: float
    daily_volatility_pct: float
    max_drawdown_pct: float
