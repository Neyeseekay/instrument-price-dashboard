import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider, useQueries } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";

import { PriceChart } from "../src/components/PriceChart";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";

// jsdom doesn't run our actual Tailwind/PostCSS pipeline, so getComputedStyle
// can't return real hex values here -- mock cssColor to just echo the
// variable name back, giving predictable "colors" to assert against without
// depending on the CSS build.
vi.mock("../src/lib/cssColor", () => ({
  cssColor: (variable: string) => variable,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueries: vi.fn() };
});

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

function fakeQueryResult(dates: string[], prices: number[]) {
  return {
    data: { series: dates.map((date, i) => ({ date, price: prices[i] })) },
    isLoading: false,
    isError: false,
  };
}

function renderWithStore(selectedTickers: string[]) {
  const store = configureStore({ reducer: { instruments: instrumentsReducer } });
  store.dispatch(setSelectedTickers(selectedTickers));
  const queryClient = new QueryClient();
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
    vi.mocked(useQueries).mockReturnValue([]);
    const { container } = renderWithStore([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading message while any query is loading", () => {
    vi.mocked(useQueries).mockReturnValue([
      { data: undefined, isLoading: true, isError: false },
    ]);
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument();
  });

  it("shows an error message if any query fails", () => {
    vi.mocked(useQueries).mockReturnValue([
      { data: undefined, isLoading: false, isError: true },
    ]);
    renderWithStore(["TICK0001"]);
    expect(screen.getByText(/couldn't load price data/i)).toBeInTheDocument();
  });

  it("renders one series per selected ticker with matching name and [timestamp, price] data", () => {
    vi.mocked(useQueries).mockReturnValue([
      fakeQueryResult(["2026-01-01", "2026-01-02"], [100, 110]),
      fakeQueryResult(["2026-01-01", "2026-01-02"], [50, 45]),
    ]);
    renderWithStore(["TICK0001", "TICK0002"]);

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

  it("hides the legend for a single ticker", () => {
    vi.mocked(useQueries).mockReturnValue([fakeQueryResult(["2026-01-01"], [100])]);
    renderWithStore(["TICK0001"]);
    expect(getChartOptions().legend.enabled).toBe(false);
  });

  it("shows the legend for multiple tickers", () => {
    vi.mocked(useQueries).mockReturnValue([
      fakeQueryResult(["2026-01-01"], [100]),
      fakeQueryResult(["2026-01-01"], [50]),
    ]);
    renderWithStore(["TICK0001", "TICK0002"]);
    expect(getChartOptions().legend.enabled).toBe(true);
  });

  it("keeps a ticker's color stable when another ticker is removed around it", () => {
    vi.mocked(useQueries).mockReturnValue([
      fakeQueryResult(["2026-01-01"], [100]),
      fakeQueryResult(["2026-01-01"], [50]),
    ]);
    const { store } = renderWithStore(["TICK0001", "TICK0002"]);

    const tick2ColorBefore = getAllSeries().find((s) => s.name === "TICK0002")!.color;

    // Remove TICK0001; TICK0002 must keep its own color, not inherit
    // TICK0001's now-freed slot.
    vi.mocked(useQueries).mockReturnValue([fakeQueryResult(["2026-01-01"], [50])]);
    act(() => {
      store.dispatch(setSelectedTickers(["TICK0002"]));
    });

    const after = getAllSeries();
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe("TICK0002");
    expect(after[0].color).toBe(tick2ColorBefore);
  });
});
