import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it } from "vitest";

import { useUrlTickerSync } from "../src/app/useUrlTickerSync";
import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";

function renderWithProviders(preloadedTickers: string[] = []) {
  const store = configureStore({ reducer: { instruments: instrumentsReducer } });
  store.dispatch(setSelectedTickers(preloadedTickers));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
  const utils = renderHook(() => useUrlTickerSync(), { wrapper });
  return { store, ...utils };
}

describe("useUrlTickerSync", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("writes the current selection to the URL on mount", () => {
    renderWithProviders(["TICK0001", "TICK0002"]);
    expect(window.location.search).toBe("?tickers=TICK0001,TICK0002");
  });

  it("leaves the URL clean when there's no selection", () => {
    renderWithProviders([]);
    expect(window.location.search).toBe("");
  });

  it("updates the URL whenever the store selection changes", () => {
    const { store } = renderWithProviders(["TICK0001"]);

    act(() => {
      store.dispatch(setSelectedTickers(["TICK0001", "TICK0003"]));
    });

    expect(window.location.search).toBe("?tickers=TICK0001,TICK0003");
  });

  it("restores the selection from the URL on a popstate (back/forward) event", () => {
    const { store } = renderWithProviders(["TICK0001"]);

    act(() => {
      window.history.pushState(null, "", "/?tickers=TICK0002,TICK0003");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(store.getState().instruments.selectedTickers).toEqual(["TICK0002", "TICK0003"]);
  });

  it("drops a ticker that isn't in the known instrument list once it loads, from both the store and the URL", async () => {
    const { store } = renderWithProviders(["TICK0001", "BOGUS"]);

    await waitFor(() => {
      expect(store.getState().instruments.selectedTickers).toEqual(["TICK0001"]);
    });
    expect(window.location.search).toBe("?tickers=TICK0001");
  });
});
