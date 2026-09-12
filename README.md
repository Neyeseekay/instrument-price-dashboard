# instrument-price-dashboard
A full-stack dashboard for browsing synthetic daily closing prices across 200 instruments, with computed return, volatility, and drawdown stats.

This project used python 3.12.10 for the backend

Environment Setup
- python -m venv venv
- source venv/bin/activate  # or venv\Scripts\activate on Windows
- pip install -r requirements.txt
- uvicorn main:app --reload
