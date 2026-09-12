from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import prices

app = FastAPI(title="Instrument Price Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev origin
    allow_methods=["GET"],  # API is read-only
    allow_headers=["*"],
)

app.include_router(prices.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
