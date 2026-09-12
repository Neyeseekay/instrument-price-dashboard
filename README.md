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
| Git | any recent version | `git --version` |

### Installing Node.js on Windows

If `node --version` doesn't resolve, install Node LTS via `winget`:

```powershell
winget install -e --id OpenJS.NodeJS.LTS
```

If prompted to accept the source agreement, type `Y` and press Enter. **Close and reopen your terminal** afterward so `PATH` picks up the new install, then verify:

```powershell
node --version
npm --version
```

(On macOS/Linux, use your usual package manager — e.g. `brew install node`, or an installer from [nodejs.org](https://nodejs.org).)

## Environment Setup

- python -m venv venv
- source venv/bin/activate  # or venv\Scripts\activate on Windows
- pip install -r requirements.txt
- uvicorn main:app --reload

## Stats methodology

All three stats are percentages. Daily "returns" are **log returns** (`ln(Pᵢ/Pᵢ₋₁)`), not simple returns (`Pᵢ/Pᵢ₋₁ - 1`) — a deliberate deviation from a literal reading of the spec's total-return formula, in method only, not outcome:

- **Total return %** is derived as `(exp(sum(daily log returns)) - 1) × 100`. Log returns are time-additive, so this is an *exact identity* with the spec's `(last/first - 1) × 100` — same answer, different path.
- **Daily volatility** is the sample standard deviation (`ddof=1`) of those same daily log returns, ×100.
- Using log returns as the one shared "return" primitive means total return and volatility are built from a single consistent definition of "return," rather than two different ones.
- For this dataset, the effect is negligible either way: max observed daily move is ~5.9%, where simple vs. log returns differ by only ~0.12 percentage points. The divergence grows with the square of the move size and only becomes material above roughly 15-20% single-day moves.
- **Max drawdown** stays a simple peak-to-trough percentage decline (the universal convention for this metric), reported as negative (0.0 if the series never declines from its running peak).

## AI assistance

This project was built with Claude Code assistance — see commit history for specifics.
