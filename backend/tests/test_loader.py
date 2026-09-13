from pathlib import Path

import pytest

from app.data.loader import load_price_store


def _write_csv(tmp_path: Path, rows: list[tuple[str, str, float]]) -> Path:
    csv_path = tmp_path / "prices.csv"
    with csv_path.open("w") as f:
        f.write("date,ticker,price\n")
        for d, ticker, price in rows:
            f.write(f"{d},{ticker},{price}\n")
    return csv_path


def test_loads_valid_business_day_data(tmp_path: Path):
    # Fri -> Mon is a 3-day gap over a weekend; should be accepted.
    rows = [
        ("2024-01-01", "AAA", 100),  # Monday
        ("2024-01-02", "AAA", 101),
        ("2024-01-03", "AAA", 102),
        ("2024-01-04", "AAA", 103),
        ("2024-01-05", "AAA", 104),  # Friday
        ("2024-01-08", "AAA", 105),  # Monday
    ]
    csv_path = _write_csv(tmp_path, rows)

    store = load_price_store(csv_path)

    assert store.tickers() == ["AAA"]
    assert len(store.get_series("AAA")) == 6


def test_rejects_monthly_cadence_data(tmp_path: Path):
    rows = [
        ("2024-01-01", "AAA", 100),
        ("2024-02-01", "AAA", 101),  # ~31-day gap
    ]
    csv_path = _write_csv(tmp_path, rows)

    with pytest.raises(ValueError, match="AAA"):
        load_price_store(csv_path)


def test_error_message_names_the_gap_size(tmp_path: Path):
    rows = [
        ("2024-01-01", "AAA", 100),
        ("2024-01-15", "AAA", 101),  # 14-day gap
    ]
    csv_path = _write_csv(tmp_path, rows)

    with pytest.raises(ValueError, match="14-day gap"):
        load_price_store(csv_path)


def test_one_ticker_with_a_gap_does_not_affect_a_valid_ticker(tmp_path: Path):
    rows = [
        ("2024-01-01", "AAA", 100),
        ("2024-01-02", "AAA", 101),
        ("2024-01-01", "BBB", 200),
        ("2024-03-01", "BBB", 201),  # large gap, BBB only
    ]
    csv_path = _write_csv(tmp_path, rows)

    with pytest.raises(ValueError, match="BBB"):
        load_price_store(csv_path)
