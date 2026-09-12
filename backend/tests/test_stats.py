import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.stats import daily_volatility_pct, max_drawdown_pct, total_return_pct

client = TestClient(app)


def test_total_return_pct():
    assert total_return_pct([100, 121]) == pytest.approx(21.0)


def test_max_drawdown_pct():
    # Dips of -40%, -20%, -16.67%, -8.33%, -25% across two separate peaks
    # (100, then 120). The largest (-40%) must win even though it's the
    # first dip, not the last, and not tied to the series' highest peak.
    prices = [100, 60, 80, 120, 100, 110, 90]
    assert max_drawdown_pct(prices) == pytest.approx(-40.0)


def test_daily_volatility_pct_flat_is_zero():
    assert daily_volatility_pct([50, 50, 50, 50]) == pytest.approx(0.0)


def test_daily_volatility_pct_positive_for_varying_prices():
    # sample stdev of log returns [ln(1.05), ln(98/105), ln(110/98)] * 100
    assert daily_volatility_pct([100, 105, 98, 110]) == pytest.approx(9.3423, abs=1e-4)


def test_unknown_ticker_returns_404():
    assert client.get("/api/prices/DOESNOTEXIST").status_code == 404


def test_unknown_ticker_stats_returns_404():
    assert client.get("/api/prices/DOESNOTEXIST/stats").status_code == 404
