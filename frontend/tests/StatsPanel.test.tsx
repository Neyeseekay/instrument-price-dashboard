import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider, useQueries } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";

import { StatsPanel } from "../src/components/StatsPanel";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";

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

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueries: vi.fn() };
});

function fakeStats(totalReturnPct: number, dailyVolatilityPct: number, maxDrawdownPct: number) {
  return { data: { totalReturnPct, dailyVolatilityPct, maxDrawdownPct }, isLoading: false, isError: false };
}

function fakePrices(closePrice: number) {
  return { data: { series: [{ date: "2026-01-01", price: closePrice }] }, isLoading: false, isError: false };
}

// StatsPanel calls useQueries twice (stats, then prices) -- distinguish
// the two calls by the query key's URL rather than call order, which is
// more robust against extra re-renders.
function mockQueries(statsResults: unknown[], priceResults: unknown[] = statsResults) {
  vi.mocked(useQueries).mockImplementation(
    ({ queries }: { queries: Array<{ queryKey?: unknown[] }> }) => {
      const key = String(queries[0]?.queryKey?.[0] ?? "");
      return (key.endsWith("/stats") ? statsResults : priceResults) as ReturnType<typeof useQueries>;
    },
  );
}

function renderWithStore(selectedTickers: string[]) {
  const store = configureStore({ reducer: { instruments: instrumentsReducer } });
  store.dispatch(setSelectedTickers(selectedTickers));
  const queryClient = new QueryClient();
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
    mockQueries([]);
    const { container } = renderWithStore([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading message while stats are loading", () => {
    mockQueries([{ data: undefined, isLoading: true, isError: false }], [fakePrices(100)]);
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/loading stats/i)).toBeInTheDocument();
  });

  it("shows a loading message while prices are loading", () => {
    mockQueries([fakeStats(1, 1, 0)], [{ data: undefined, isLoading: true, isError: false }]);
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/loading stats/i)).toBeInTheDocument();
  });

  it("shows an error message if either query fails", () => {
    mockQueries([{ data: undefined, isLoading: false, isError: true }], [fakePrices(100)]);
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/couldn't load stats/i)).toBeInTheDocument();
  });

  it("renders formatted close, return, volatility, and drawdown for each ticker", () => {
    mockQueries([fakeStats(10.804, 1.527, -13.385)], [fakePrices(353.74)]);
    renderWithStore(["TICK0001"]);

    expect(screen.getByText("$353.74")).toBeInTheDocument();
    expect(screen.getByText("+10.80%")).toBeInTheDocument();
    expect(screen.getByText("1.53%")).toBeInTheDocument();
    expect(screen.getByText("-13.38%")).toBeInTheDocument();
  });

  it("colors a positive return good and a negative return critical", () => {
    mockQueries(
      [fakeStats(10, 1, 0), fakeStats(-5, 1, 0)],
      [fakePrices(100), fakePrices(50)],
    );
    renderWithStore(["TICK0001", "TICK0002"]);

    expect(screen.getByText("+10.00%")).toHaveClass("text-good");
    expect(screen.getByText("-5.00%")).toHaveClass("text-critical");
  });

  it("a zero return is neutral, not good or critical", () => {
    mockQueries([fakeStats(0, 5, -8)], [fakePrices(100)]);
    renderWithStore(["TICK0001"]);

    const returnValue = screen.getByText("0.00%", { selector: "span" });
    expect(returnValue).toHaveClass("text-ink");
    expect(returnValue).not.toHaveClass("text-good", "text-critical");
  });

  it("colors a negative drawdown critical and a zero drawdown neutral", () => {
    mockQueries(
      [fakeStats(0, 1, -8), fakeStats(0, 1, 0)],
      [fakePrices(100), fakePrices(50)],
    );
    renderWithStore(["TICK0001", "TICK0002"]);

    expect(screen.getByText("-8.00%")).toHaveClass("text-critical");
  });

  it("gives each ticker's accent bar and name its assigned color-variable", () => {
    mockQueries(
      [fakeStats(1, 1, 0), fakeStats(1, 1, 0)],
      [fakePrices(100), fakePrices(50)],
    );
    const { container } = renderWithStore(["TICK0001", "TICK0002"]);

    const bars = container.querySelectorAll('span[aria-hidden="true"]');
    expect((bars[0] as HTMLElement).style.backgroundColor).toBe("rgb(1, 1, 1)");
    expect((bars[1] as HTMLElement).style.backgroundColor).toBe("rgb(2, 2, 2)");
  });
});
