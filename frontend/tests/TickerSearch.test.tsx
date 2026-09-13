import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";

import { TickerSearch } from "../src/components/TickerSearch";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";
import { server } from "../src/mocks/server";

const INSTRUMENTS_URL = "http://localhost:8000/api/instruments";

function renderWithProviders(preloadedTickers: string[] = []) {
  const store = configureStore({ reducer: { instruments: instrumentsReducer } });
  store.dispatch(setSelectedTickers(preloadedTickers));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
    const user = userEvent.setup();
    const { store } = renderWithProviders();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "TICK0002" }));

    expect(store.getState().instruments.selectedTickers).toEqual(["TICK0002"]);
    expect(screen.getByRole("button", { name: "Remove TICK0002" })).toBeInTheDocument();
  });

  it("removing a chip clears the selection from the store", async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(["TICK0002"]);

    await user.click(screen.getByRole("button", { name: "Remove TICK0002" }));

    expect(store.getState().instruments.selectedTickers).toEqual([]);
    expect(screen.queryByRole("button", { name: "Remove TICK0002" })).not.toBeInTheDocument();
  });

  it("caps selection at 3 tickers by disabling the rest", async () => {
    const user = userEvent.setup();
    renderWithProviders(["TICK0001", "TICK0002", "TICK0003"]);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "TICK0004" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows a loading placeholder and disables the search while fetching", () => {
    server.use(
      http.get(INSTRUMENTS_URL, async () => {
        await delay("infinite");
      }),
    );
    renderWithProviders();

    expect(screen.getByPlaceholderText("Loading tickers...")).toBeDisabled();
  });

  it("shows an error message and disables the search if the fetch fails", async () => {
    server.use(
      http.get(INSTRUMENTS_URL, () =>
        HttpResponse.json({ detail: "server error" }, { status: 500 }),
      ),
    );
    renderWithProviders();

    expect(await screen.findByText(/couldn't load tickers/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
