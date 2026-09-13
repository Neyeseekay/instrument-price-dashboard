import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";

import { PriceChart } from "../src/components/PriceChart";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";
import { server } from "../src/mocks/server";

// jsdom doesn't run our actual Tailwind/PostCSS pipeline, so getComputedStyle
// can't return real hex values here -- mock cssColor to just echo the
// variable name back, giving predictable "colors" to assert against without
// depending on the CSS build.
vi.mock("../src/lib/cssColor", () => ({
  cssColor: (variable: string) => variable,
}));

// Highcharts renders to SVG via imperative DOM manipulation jsdom can't
// really do -- stub both components and capture the props they were given,
// so tests assert on OUR data/color logic, not Highcharts' own rendering.
vi.mock("@highcharts/react", () => ({
  Chart: (props: { options: unknown; children?: React.ReactNode }) => (
    <div data-testid="stock-chart" data-options={JSON.stringify(props.options)}>
      {props.children}
    </div>
  ),
}));

vi.mock("@highcharts/react/series/Line", () => ({
  LineSeries: (props: { name?: string; color?: string; data?: unknown }) => (
    <div data-testid="series" data-series={JSON.stringify(props)} />
  ),
}));

const PRICES_URL = "http://localhost:8000/api/prices/:ticker";

function mockPrices(seriesByTicker: Record<string, { date: string; price: number }[]>) {
  server.use(
    http.get(PRICES_URL, ({ params }) => {
      const ticker = String(params.ticker).toUpperCase();
      const series = seriesByTicker[ticker];
      if (!series) return HttpResponse.json({ detail: "not found" }, { status: 404 });
      return HttpResponse.json({ ticker, series });
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
        <PriceChart />
      </QueryClientProvider>
    </Provider>,
  );
  return { store, ...utils };
}

function getChartOptions() {
  return JSON.parse(screen.getByTestId("stock-chart").getAttribute("data-options")!);
}

function getAllSeries() {
  return screen.getAllByTestId("series").map((el) => JSON.parse(el.getAttribute("data-series")!));
}

describe("PriceChart", () => {
  it("renders nothing when no tickers are selected", () => {
    const { container } = renderWithStore([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading message while any query is loading", () => {
    server.use(
      http.get(PRICES_URL, async () => {
        await delay("infinite");
      }),
    );
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument();
  });

  it("shows an error message if any query fails", async () => {
    server.use(http.get(PRICES_URL, () => HttpResponse.json({ detail: "error" }, { status: 500 })));
    renderWithStore(["TICK0001"]);
    expect(await screen.findByText(/couldn't load price data/i)).toBeInTheDocument();
  });

  it("renders one series per selected ticker with matching name and [timestamp, price] data", async () => {
    mockPrices({
      TICK0001: [
        { date: "2026-01-01", price: 100 },
        { date: "2026-01-02", price: 110 },
      ],
      TICK0002: [{ date: "2026-01-01", price: 50 }],
    });
    renderWithStore(["TICK0001", "TICK0002"]);

    await screen.findByTestId("stock-chart");
    const series = getAllSeries();
    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({
      name: "TICK0001",
      data: [
        [Date.parse("2026-01-01"), 100],
        [Date.parse("2026-01-02"), 110],
      ],
    });
    expect(series[1]).toMatchObject({ name: "TICK0002", data: expect.any(Array) });
  });

  it("hides the legend for a single ticker", async () => {
    renderWithStore(["TICK0001"]);
    await screen.findByTestId("stock-chart");
    expect(getChartOptions().legend.enabled).toBe(false);
  });

  it("shows the legend for multiple tickers", async () => {
    renderWithStore(["TICK0001", "TICK0002"]);
    await screen.findByTestId("stock-chart");
    expect(getChartOptions().legend.enabled).toBe(true);
  });

  it("keeps a ticker's color stable when another ticker is removed around it", async () => {
    const { store } = renderWithStore(["TICK0001", "TICK0002"]);
    await screen.findByTestId("stock-chart");

    const tick2ColorBefore = getAllSeries().find((s) => s.name === "TICK0002")!.color;

    // Remove TICK0001; TICK0002 must keep its own color, not inherit
    // TICK0001's now-freed slot.
    act(() => {
      store.dispatch(setSelectedTickers(["TICK0002"]));
    });

    await screen.findByTestId("stock-chart");
    const after = getAllSeries();
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe("TICK0002");
    expect(after[0].color).toBe(tick2ColorBefore);
  });
});
