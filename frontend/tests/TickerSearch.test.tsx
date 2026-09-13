import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";

import * as generatedApi from "../src/api/generated/endpoints";
import { TickerSearch } from "../src/components/TickerSearch";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";

type UseListInstrumentsResult = ReturnType<typeof generatedApi.useListInstruments>;

const MOCK_TICKERS = Array.from({ length: 20 }, (_, i) => `TICK${String(i + 1).padStart(4, "0")}`);

// No MSW yet (deferred -- see memory) -- mock the generated hook directly
// rather than let it make a real network call in tests.
function mockUseListInstruments(overrides: Partial<UseListInstrumentsResult> = {}) {
  vi.spyOn(generatedApi, "useListInstruments").mockReturnValue({
    data: MOCK_TICKERS,
    isLoading: false,
    isError: false,
    ...overrides,
  } as UseListInstrumentsResult);
}

function renderWithProviders(preloadedTickers: string[] = []) {
  const store = configureStore({ reducer: { instruments: instrumentsReducer } });
  store.dispatch(setSelectedTickers(preloadedTickers));
  const queryClient = new QueryClient();
  const utils = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TickerSearch />
      </QueryClientProvider>
    </Provider>,
  );
  return { store, ...utils };
}

describe("TickerSearch", () => {
  it("selecting a ticker via the combobox adds it to the store and renders a chip", async () => {
    mockUseListInstruments();
    const user = userEvent.setup();
    const { store } = renderWithProviders();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "TICK0002" }));

    expect(store.getState().instruments.selectedTickers).toEqual(["TICK0002"]);
    expect(screen.getByRole("button", { name: "Remove TICK0002" })).toBeInTheDocument();
  });

  it("removing a chip clears the selection from the store", async () => {
    mockUseListInstruments();
    const user = userEvent.setup();
    const { store } = renderWithProviders(["TICK0002"]);

    await user.click(screen.getByRole("button", { name: "Remove TICK0002" }));

    expect(store.getState().instruments.selectedTickers).toEqual([]);
    expect(screen.queryByRole("button", { name: "Remove TICK0002" })).not.toBeInTheDocument();
  });

  it("caps selection at 3 tickers by disabling the rest", async () => {
    mockUseListInstruments();
    const user = userEvent.setup();
    renderWithProviders(["TICK0001", "TICK0002", "TICK0003"]);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "TICK0004" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows a loading placeholder and disables the search while fetching", () => {
    mockUseListInstruments({ data: undefined, isLoading: true });
    renderWithProviders();

    expect(screen.getByPlaceholderText("Loading tickers...")).toBeDisabled();
  });

  it("shows an error message and disables the search if the fetch fails", () => {
    mockUseListInstruments({ data: undefined, isLoading: false, isError: true });
    renderWithProviders();

    expect(screen.getByText(/couldn't load tickers/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
