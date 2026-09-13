import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider, useQueries } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";

import { PriceChart } from "../src/components/PriceChart";
import instrumentsReducer from "../src/features/instruments/instrumentsSlice";

// jsdom doesn't run our actual Tailwind/PostCSS pipeline, so getComputedStyle
// can't return real hex values here -- mock cssColor to just echo the
// variable name back, giving three distinct, predictable "colors" to assert
// against without depending on the CSS build.
vi.mock("../src/lib/cssColor", () => ({
  cssColor: (variable: string) => variable,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueries: vi.fn() };
});

// react-chartjs-2's <Line> renders to <canvas> via Chart.js, which jsdom
// can't render -- stub it and capture the props it was given instead, so
// tests assert on OUR data/color logic, not Chart.js's own rendering.
vi.mock("react-chartjs-2", () => ({
  Line: (props: { data: unknown; options: unknown }) => (
    <div data-testid="line-chart" data-chart={JSON.stringify(props)} />
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
  const store = configureStore({
    reducer: { instruments: instrumentsReducer },
    preloadedState: { instruments: { selectedTickers } },
  });
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

function getChartProps() {
  return JSON.parse(screen.getByTestId("line-chart").getAttribute("data-chart")!);
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

  it("renders one dataset per selected ticker with matching labels and prices", () => {
    vi.mocked(useQueries).mockReturnValue([
      fakeQueryResult(["2026-01-01", "2026-01-02"], [100, 110]),
      fakeQueryResult(["2026-01-01", "2026-01-02"], [50, 45]),
    ]);
    renderWithStore(["TICK0001", "TICK0002"]);

    const { data } = getChartProps();
    expect(data.labels).toEqual(["2026-01-01", "2026-01-02"]);
    expect(data.datasets).toHaveLength(2);
    expect(data.datasets[0]).toMatchObject({ label: "TICK0001", data: [100, 110] });
    expect(data.datasets[1]).toMatchObject({ label: "TICK0002", data: [50, 45] });
  });

  it("hides the legend for a single ticker", () => {
    vi.mocked(useQueries).mockReturnValue([fakeQueryResult(["2026-01-01"], [100])]);
    renderWithStore(["TICK0001"]);
    expect(getChartProps().options.plugins.legend.display).toBe(false);
  });

  it("shows the legend for multiple tickers", () => {
    vi.mocked(useQueries).mockReturnValue([
      fakeQueryResult(["2026-01-01"], [100]),
      fakeQueryResult(["2026-01-01"], [50]),
    ]);
    renderWithStore(["TICK0001", "TICK0002"]);
    expect(getChartProps().options.plugins.legend.display).toBe(true);
  });

  it("keeps a ticker's color stable when another ticker is removed around it", () => {
    vi.mocked(useQueries).mockReturnValue([
      fakeQueryResult(["2026-01-01"], [100]),
      fakeQueryResult(["2026-01-01"], [50]),
    ]);
    const { store } = renderWithStore(["TICK0001", "TICK0002"]);

    const before = getChartProps().data.datasets;
    const tick2ColorBefore = before.find((d: { label: string }) => d.label === "TICK0002")
      .borderColor;

    // Remove TICK0001; TICK0002 must keep its own color, not inherit
    // TICK0001's now-freed slot.
    vi.mocked(useQueries).mockReturnValue([fakeQueryResult(["2026-01-01"], [50])]);
    act(() => {
      store.dispatch({ type: "instruments/setSelectedTickers", payload: ["TICK0002"] });
    });

    const after = getChartProps().data.datasets;
    expect(after[0].label).toBe("TICK0002");
    expect(after[0].borderColor).toBe(tick2ColorBefore);
  });
});
