from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from app import stats as stats_lib
from app.data.loader import PriceStore, load_price_store
from app.models import PricePointOut, PriceSeriesOut, StatsOut

DEFAULT_CSV_PATH = Path(__file__).parent.parent / "data" / "market_data.csv"


@lru_cache
def get_price_store() -> PriceStore:
    return load_price_store(DEFAULT_CSV_PATH)


router = APIRouter(prefix="/api", tags=["prices"])


def _get_series_or_404(ticker: str, store: PriceStore):
    series = store.get_series(ticker)
    if series is None:
        raise HTTPException(status_code=404, detail=f"Unknown ticker: {ticker.upper()}")
    return series


@router.get("/instruments", response_model=list[str])
def list_instruments(store: PriceStore = Depends(get_price_store)) -> list[str]:
    return store.tickers()


@router.get("/prices/{ticker}", response_model=PriceSeriesOut)
def get_prices(ticker: str, store: PriceStore = Depends(get_price_store)) -> PriceSeriesOut:
    series = _get_series_or_404(ticker, store)
    return PriceSeriesOut(
        ticker=ticker.upper(),
        series=[PricePointOut(date=p.date, price=p.price) for p in series],
    )


@router.get("/prices/{ticker}/stats", response_model=StatsOut)
def get_stats(ticker: str, store: PriceStore = Depends(get_price_store)) -> StatsOut:
    series = _get_series_or_404(ticker, store)
    prices = [p.price for p in series]
    return StatsOut(
        ticker=ticker.upper(),
        total_return_pct=stats_lib.total_return_pct(prices),
        daily_volatility_pct=stats_lib.daily_volatility_pct(prices),
        max_drawdown_pct=stats_lib.max_drawdown_pct(prices),
    )
