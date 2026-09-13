import { http, HttpResponse } from "msw";

// Matches customInstance.ts's baseURL -- MSW intercepts requests to this
// exact origin, real or fake backend running or not.
const BASE_URL = "http://localhost:8000";

export const MOCK_TICKERS = Array.from({ length: 20 }, (_, i) => `TICK${String(i + 1).padStart(4, "0")}`);

function generateSeries(seed: number) {
  const start = new Date("2026-06-23");
  let price = 100 + seed * 15;
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    price += Math.sin(i / 3 + seed) * 4;
    return { date: date.toISOString().slice(0, 10), price: Math.round(price * 100) / 100 };
  });
}

const seriesByTicker: Record<string, { date: string; price: number }[]> = Object.fromEntries(
  MOCK_TICKERS.map((ticker, i) => [ticker, generateSeries(i)]),
);

const statsByTicker: Record<
  string,
  { totalReturnPct: number; dailyVolatilityPct: number; maxDrawdownPct: number }
> = Object.fromEntries(
  MOCK_TICKERS.map((ticker, i) => [
    ticker,
    {
      totalReturnPct: (i - 10) * 1.5,
      dailyVolatilityPct: 1 + i * 0.2,
      maxDrawdownPct: -(2 + i * 0.5),
    },
  ]),
);

export const handlers = [
  http.get(`${BASE_URL}/api/instruments`, () => HttpResponse.json(MOCK_TICKERS)),

  http.get(`${BASE_URL}/api/prices/:ticker`, ({ params }) => {
    const ticker = String(params.ticker).toUpperCase();
    const series = seriesByTicker[ticker];
    if (!series) {
      return HttpResponse.json({ detail: `Unknown ticker: ${ticker}` }, { status: 404 });
    }
    return HttpResponse.json({ ticker, series });
  }),

  http.get(`${BASE_URL}/api/prices/:ticker/stats`, ({ params }) => {
    const ticker = String(params.ticker).toUpperCase();
    const stats = statsByTicker[ticker];
    if (!stats) {
      return HttpResponse.json({ detail: `Unknown ticker: ${ticker}` }, { status: 404 });
    }
    return HttpResponse.json({ ticker, ...stats });
  }),
];
