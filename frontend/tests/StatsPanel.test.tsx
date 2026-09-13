import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";

import { StatsPanel } from "../src/components/StatsPanel";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";
import { server } from "../src/mocks/server";

// Same rationale as PriceChart.test.tsx: jsdom doesn't run our Tailwind
// pipeline, so getComputedStyle can't return real hex values. Unlike
// PriceChart (which only captures this as a plain mocked-component prop),
// StatsPanel assigns it to a real inline style.backgroundColor -- which
// jsdom validates as real CSS -- so the mock must return valid colors,
// not the raw (invalid-as-CSS) "--color-series-N" variable name.
vi.mock("../src/lib/cssColor", () => ({
  cssColor: (variable: string) =>
    (
      ({
        "--color-series-1": "rgb(1, 1, 1)",
        "--color-series-2": "rgb(2, 2, 2)",
        "--color-series-3": "rgb(3, 3, 3)",
      }) as Record<string, string>
    )[variable] ?? variable,
}));

const STATS_URL = "http://localhost:8000/api/prices/:ticker/stats";
const PRICES_URL = "http://localhost:8000/api/prices/:ticker";

type Stats = { totalReturnPct: number; dailyVolatilityPct: number; maxDrawdownPct: number };

function mockTickers(data: Record<string, { stats: Stats; close: number }>) {
  server.use(
    http.get(STATS_URL, ({ params }) => {
      const entry = data[String(params.ticker).toUpperCase()];
      if (!entry) return HttpResponse.json({ detail: "not found" }, { status: 404 });
      return HttpResponse.json({ ticker: params.ticker, ...entry.stats });
    }),
    http.get(PRICES_URL, ({ params }) => {
      const entry = data[String(params.ticker).toUpperCase()];
      if (!entry) return HttpResponse.json({ detail: "not found" }, { status: 404 });
      return HttpResponse.json({
        ticker: params.ticker,
        series: [{ date: "2026-01-01", price: entry.close }],
      });
    }),
  );
}

function renderWithStore(selectedTickers: string[]) {
  const store = configureStore({ reducer: { instruments: instrumentsReducer } });
  store.dispatch(setSelectedTickers(selectedTickers));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StatsPanel />
      </QueryClientProvider>
    </Provider>,
  );
  return { store, ...utils };
}

describe("StatsPanel", () => {
  it("renders nothing when no tickers are selected", () => {
    const { container } = renderWithStore([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading message while stats are loading", () => {
    server.use(
      http.get(STATS_URL, async () => {
        await delay("infinite");
      }),
    );
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/loading stats/i)).toBeInTheDocument();
  });

  it("shows a loading message while prices are loading", () => {
    server.use(
      http.get(PRICES_URL, async () => {
        await delay("infinite");
      }),
    );
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/loading stats/i)).toBeInTheDocument();
  });

  it("shows an error message if either query fails", async () => {
    server.use(http.get(STATS_URL, () => HttpResponse.json({ detail: "error" }, { status: 500 })));
    renderWithStore(["TICK0001"]);
    expect(await screen.findByText(/couldn't load stats/i)).toBeInTheDocument();
  });

  it("renders formatted close, return, volatility, and drawdown for each ticker", async () => {
    mockTickers({
      TICK0001: {
        stats: { totalReturnPct: 10.804, dailyVolatilityPct: 1.527, maxDrawdownPct: -13.385 },
        close: 353.74,
      },
    });
    renderWithStore(["TICK0001"]);

    expect(await screen.findByText("$353.74")).toBeInTheDocument();
    expect(screen.getByText("+10.80%")).toBeInTheDocument();
    expect(screen.getByText("1.53%")).toBeInTheDocument();
    expect(screen.getByText("-13.38%")).toBeInTheDocument();
  });

  it("colors a positive return good and a negative return critical", async () => {
    mockTickers({
      TICK0001: { stats: { totalReturnPct: 10, dailyVolatilityPct: 1, maxDrawdownPct: 0 }, close: 100 },
      TICK0002: { stats: { totalReturnPct: -5, dailyVolatilityPct: 1, maxDrawdownPct: 0 }, close: 50 },
    });
    renderWithStore(["TICK0001", "TICK0002"]);

    expect(await screen.findByText("+10.00%")).toHaveClass("text-good");
    expect(screen.getByText("-5.00%")).toHaveClass("text-critical");
  });

  it("a zero return is neutral, not good or critical", async () => {
    mockTickers({
      TICK0001: { stats: { totalReturnPct: 0, dailyVolatilityPct: 5, maxDrawdownPct: -8 }, close: 100 },
    });
    renderWithStore(["TICK0001"]);

    const returnValue = await screen.findByText("0.00%", { selector: "span" });
    expect(returnValue).toHaveClass("text-ink");
    expect(returnValue).not.toHaveClass("text-good", "text-critical");
  });

  it("colors a negative drawdown critical and a zero drawdown neutral", async () => {
    mockTickers({
      TICK0001: { stats: { totalReturnPct: 0, dailyVolatilityPct: 1, maxDrawdownPct: -8 }, close: 100 },
      TICK0002: { stats: { totalReturnPct: 0, dailyVolatilityPct: 1, maxDrawdownPct: 0 }, close: 50 },
    });
    renderWithStore(["TICK0001", "TICK0002"]);

    expect(await screen.findByText("-8.00%")).toHaveClass("text-critical");
  });

  it("gives each ticker's accent bar and name its assigned color-variable", async () => {
    mockTickers({
      TICK0001: { stats: { totalReturnPct: 1, dailyVolatilityPct: 1, maxDrawdownPct: 0 }, close: 100 },
      TICK0002: { stats: { totalReturnPct: 1, dailyVolatilityPct: 1, maxDrawdownPct: 0 }, close: 50 },
    });
    const { container } = renderWithStore(["TICK0001", "TICK0002"]);

    await screen.findByText("TICK0001");
    const bars = container.querySelectorAll('span[aria-hidden="true"]');
    expect((bars[0] as HTMLElement).style.backgroundColor).toBe("rgb(1, 1, 1)");
    expect((bars[1] as HTMLElement).style.backgroundColor).toBe("rgb(2, 2, 2)");
  });
});
