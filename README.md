# instrument-price-dashboard
A full-stack dashboard for browsing synthetic daily closing prices across 200 instruments, with computed return, volatility, and drawdown stats.

**Stack:** Python (FastAPI) backend, React + TypeScript (Redux Toolkit, Tailwind CSS, Highcharts) frontend.

## Prerequisites

Install these before running the project:

| Tool | Version used in development | Check with |
|---|---|---|
| Python | 3.12.10 | `python --version` |
| Node.js (LTS) | v24.19.0 | `node --version` |
| npm | 11.17.0 | `npm --version` |
| Docker Desktop (optional) | 29.7.2 | `docker --version` |
| Git | any recent version | `git --version` |

Docker is only needed if you want to run either service in a container; the local setups below work without it.

## Running the backend

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

### Tests

```bash
cd backend
pytest        # tests
ruff check .  # lint
```

## Running the frontend

### Locally (Vite dev server)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Expects the backend running at `http://localhost:8000` (see above).

### With mock data (no backend needed)

```bash
cd frontend
npm install
npm run dev:mock
```

Runs the full UI against fake data via [Mock Service Worker](https://mswjs.io/) — useful for frontend-only work, or demoing without the backend running at all.

### With Docker

```bash
cd frontend
docker build -t instrument-price-dashboard-frontend .
docker run -d --rm -p 5173:80 --name ipd-frontend instrument-price-dashboard-frontend
```

Serves the production build via nginx at `http://localhost:5173`. Stop it with `docker stop ipd-frontend`.

### Tests

```bash
cd frontend
npm run test  # tests
npm run lint  # lint
```

## Running both services together (Docker Compose)

```bash
docker compose up --build
```

Backend at `http://localhost:8000`, frontend at `http://localhost:5173` (the frontend is built and served via nginx, not the Vite dev server, in this mode). Stop with `docker compose down`.

## Stats methodology

All three stats are percentages. Daily "returns" are **log returns** (`ln(Pᵢ/Pᵢ₋₁)`), not simple returns (`Pᵢ/Pᵢ₋₁ - 1`) — a deliberate deviation from a literal reading of the spec's total-return formula, in method only, not outcome:

- **Total return %** is derived as `(exp(sum(daily log returns)) - 1) × 100`. Log returns are time-additive, so this is an *exact identity* with the spec's `(last/first - 1) × 100` — same answer, different path.
- **Daily volatility** is the sample standard deviation (`ddof=1`) of those same daily log returns, ×100.
- Using log returns as the one shared "return" primitive means total return and volatility are built from a single consistent definition of "return," rather than two different ones.
- For this dataset, the effect is negligible either way: max observed daily move is ~5.9%, where simple vs. log returns differ by only ~0.12 percentage points. The divergence grows with the square of the move size and only becomes material above roughly 15-20% single-day moves.
- **Max drawdown** stays a simple peak-to-trough percentage decline (the universal convention for this metric), reported as negative (0.0 if the series never declines from its running peak).

## AI assistance

This project was built with Claude Code assistance — see commit history for specifics.

## Beyond the spec

The take-home asked for a backend, a frontend, and the ability to run locally. A few things here go past that bar:

- **Type-safe, drift-checked API contract.** The backend exports its OpenAPI schema (`app/export_openapi.py`); [orval](frontend/orval.config.ts) generates the frontend's typed client and React Query hooks from it (`frontend/src/api/generated`). A dedicated CI job regenerates the client on every push and fails the build if it doesn't match what's committed — the frontend can't silently drift from what the backend actually serves.
- **CI pipeline.** `.github/workflows/ci.yml` runs lint, test, and build for both services independently, plus the contract-drift check above — not just "it runs on my machine."
- **Docker for both services, plus Compose.** `backend/Dockerfile`, `frontend/Dockerfile` (built and served via nginx), and `docker-compose.yml` bring the whole stack up with one command.
- **Backend-independent dev mode.** [Mock Service Worker](https://mswjs.io/) (`frontend/src/mocks`) lets the full UI run against realistic fake data with no backend running at all (`npm run dev:mock`) — useful for frontend-only work or demoing offline.
- **A real test suite.** 9 frontend test files and 2 backend test files (~825 lines total) covering the search/multi-select component, chart, stats panel, Redux slice, and generated API client — not just a happy-path smoke test.
- **Data-quality guard at ingestion.** The CSV loader (`backend/app/data/loader.py`) validates that every ticker's dates are actually daily/business-day cadence and fails loudly if not, rather than silently computing "daily" volatility on weekly or monthly data.
- **Documented stats methodology.** The section above doesn't just state the formulas used — it explains the log-return choice, proves it's mathematically identical to the spec's total-return formula, and quantifies how much it would diverge from simple returns on this dataset.
