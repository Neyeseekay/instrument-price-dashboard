"""Loads the source CSV (date, ticker, price) into an in-memory,
ticker-indexed DataFrame. No database, per spec — read once, held in
memory for the life of the process.
"""

from datetime import date
from pathlib import Path
from typing import NamedTuple

import pandas as pd

# Covers weekends/holidays (a Friday -> Monday gap is 3 days) while
# rejecting weekly/monthly cadence data, which would otherwise silently
# get labeled "daily" in the stats without anyone noticing.
MAX_GAP_DAYS = 4


class PricePoint(NamedTuple):
    date: date
    price: float


class PriceStore:
    def __init__(self, df: pd.DataFrame):
        self._df = df  # indexed by ticker, columns: date, price

    def tickers(self) -> list[str]:
        return sorted(self._df.index.unique())

    def get_series(self, ticker: str) -> list[PricePoint] | None:
        if ticker not in self._df.index:
            return None
        rows = self._df.loc[[ticker]]  # see note below on the double brackets
        return [
            PricePoint(date=row.date.date(), price=float(row.price))
            for row in rows.itertuples()
        ]


def _validate_daily_cadence(df: pd.DataFrame) -> None:
    """Fail loudly if any ticker's dates aren't daily (or business-day)
    cadence, rather than silently computing stats mislabeled "daily"."""
    gap_days = df.groupby(level=0)["date"].diff().dt.days
    violations = gap_days[gap_days > MAX_GAP_DAYS]
    if not violations.empty:
        ticker = violations.index[0]
        raise ValueError(
            f"Expected daily (or business-day) price data; found a "
            f"{violations.iloc[0]:.0f}-day gap for ticker {ticker}. This app "
            f"assumes consecutive dates are never more than {MAX_GAP_DAYS} days apart."
        )


def load_price_store(csv_path: Path) -> PriceStore:
    if not csv_path.exists():
        raise FileNotFoundError(f"Price data CSV not found at {csv_path}")

    df = pd.read_csv(csv_path, parse_dates=["date"])
    df = df.sort_values(["ticker", "date"]).set_index("ticker")
    _validate_daily_cadence(df)
    return PriceStore(df)
