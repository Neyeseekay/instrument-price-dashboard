"""Pure statistics functions over a price series. See README's "Stats
methodology" section for the reasoning behind these formulas.
"""

import math
import statistics


def daily_returns(prices: list[float]) -> list[float]:
    return [math.log(prices[i] / prices[i - 1]) for i in range(1, len(prices))]


def total_return_pct(prices: list[float]) -> float:
    if len(prices) < 2:
        raise ValueError("total_return_pct requires at least 2 price points")
    return (math.exp(sum(daily_returns(prices))) - 1) * 100


def daily_volatility_pct(prices: list[float]) -> float:
    returns = daily_returns(prices)
    if len(returns) < 2:
        return 0.0
    return statistics.stdev(returns) * 100


def max_drawdown_pct(prices: list[float]) -> float:
    peak = prices[0]
    max_dd = 0.0
    for price in prices:
        peak = max(peak, price)
        drawdown = (price - peak) / peak
        max_dd = min(max_dd, drawdown)
    return max_dd * 100
