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

## AI assistance

This project was built with Claude Code assistance — see commit history for specifics.
