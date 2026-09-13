# instrument-price-dashboard
A full-stack dashboard for browsing synthetic daily closing prices across 200 instruments, with computed return, volatility, and drawdown stats.

**Stack:** Python (FastAPI) backend, React + TypeScript (Redux Toolkit, Tailwind CSS, Chart.js) frontend.

## Prerequisites

Install these before running the project:

| Tool | Version used in development | Check with |
|---|---|---|
| Python | 3.12.10 | `python --version` |
| Node.js (LTS) | v24.19.0 | `node --version` |
| npm | 11.17.0 | `npm --version` |
| Docker Desktop (optional) | 29.7.2 | `docker --version` |
| Git | any recent version | `git --version` |

Docker is only needed if you want to run the backend in a container; the local Python setup below works without it.

### Locally (Python)

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Place the source data at `backend/app/data/market_data.csv` (columns: `date, ticker, price`) before starting — the server won't start without it.

Once running: `http://localhost:8000/docs` for interactive API docs (try each endpoint from the browser), `http://localhost:8000/health` for a liveness check.

### With Docker

```bash
cd backend
docker build -t instrument-price-dashboard-backend .
docker run -d --rm -p 8000:8000 --name ipd-backend instrument-price-dashboard-backend
```

Same endpoints as above, still at `http://localhost:8000` (mapped out of the container). Stop it with:

```bash
docker stop ipd-backend
```

## Stats methodology

All three stats are percentages. Daily "returns" are **log returns** (`ln(Pᵢ/Pᵢ₋₁)`), not simple returns (`Pᵢ/Pᵢ₋₁ - 1`) — a deliberate deviation from a literal reading of the spec's total-return formula, in method only, not outcome:

- **Total return %** is derived as `(exp(sum(daily log returns)) - 1) × 100`. Log returns are time-additive, so this is an *exact identity* with the spec's `(last/first - 1) × 100` — same answer, different path.
- **Daily volatility** is the sample standard deviation (`ddof=1`) of those same daily log returns, ×100.
- Using log returns as the one shared "return" primitive means total return and volatility are built from a single consistent definition of "return," rather than two different ones.
- For this dataset, the effect is negligible either way: max observed daily move is ~5.9%, where simple vs. log returns differ by only ~0.12 percentage points. The divergence grows with the square of the move size and only becomes material above roughly 15-20% single-day moves.
- **Max drawdown** stays a simple peak-to-trough percentage decline (the universal convention for this metric), reported as negative (0.0 if the series never declines from its running peak).

## AI assistance

This project was built with Claude Code assistance — see commit history for specifics.
