import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";

import { TickerSearch } from "../src/components/TickerSearch";
import instrumentsReducer from "../src/features/instruments/instrumentsSlice";

function renderWithStore(preloadedTickers: string[] = []) {
  const store = configureStore({
    reducer: { instruments: instrumentsReducer },
    preloadedState: { instruments: { selectedTickers: preloadedTickers } },
  });
  const utils = render(
    <Provider store={store}>
      <TickerSearch />
    </Provider>,
  );
  return { store, ...utils };
}

describe("TickerSearch", () => {
  it("selecting a ticker via the combobox adds it to the store and renders a chip", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "TICK0002" }));

    expect(store.getState().instruments.selectedTickers).toEqual(["TICK0002"]);
    expect(screen.getByRole("button", { name: "Remove TICK0002" })).toBeInTheDocument();
  });

  it("removing a chip clears the selection from the store", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(["TICK0002"]);

    await user.click(screen.getByRole("button", { name: "Remove TICK0002" }));

    expect(store.getState().instruments.selectedTickers).toEqual([]);
    expect(screen.queryByRole("button", { name: "Remove TICK0002" })).not.toBeInTheDocument();
  });

  it("caps selection at 3 tickers by disabling the rest", async () => {
    const user = userEvent.setup();
    renderWithStore(["TICK0001", "TICK0002", "TICK0003"]);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "TICK0004" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
