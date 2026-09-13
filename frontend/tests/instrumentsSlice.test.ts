import { describe, expect, it } from "vitest";

import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";

describe("instrumentsSlice", () => {
  it("has an empty selectedTickers array and no color assignments initially", () => {
    const state = instrumentsReducer(undefined, { type: "@@INIT" });
    expect(state.selectedTickers).toEqual([]);
    expect(state.tickerColorVars).toEqual({});
  });

  it("setSelectedTickers replaces the selection", () => {
    const state = instrumentsReducer(
      { selectedTickers: ["AAPL"], tickerColorVars: {} },
      setSelectedTickers(["MSFT", "GOOGL"]),
    );
    expect(state.selectedTickers).toEqual(["MSFT", "GOOGL"]);
  });

  it("setSelectedTickers can clear the selection", () => {
    const state = instrumentsReducer(
      { selectedTickers: ["AAPL"], tickerColorVars: {} },
      setSelectedTickers([]),
    );
    expect(state.selectedTickers).toEqual([]);
    expect(state.tickerColorVars).toEqual({});
  });

  it("assigns color vars to newly selected tickers, in order", () => {
    const state = instrumentsReducer(
      { selectedTickers: [], tickerColorVars: {} },
      setSelectedTickers(["AAPL", "MSFT"]),
    );
    expect(state.tickerColorVars).toEqual({
      AAPL: "--color-series-1",
      MSFT: "--color-series-2",
    });
  });

  it("keeps a survivor's color var stable when another ticker is removed", () => {
    const withTwo = instrumentsReducer(
      { selectedTickers: [], tickerColorVars: {} },
      setSelectedTickers(["AAPL", "MSFT"]),
    );

    const afterRemoval = instrumentsReducer(withTwo, setSelectedTickers(["MSFT"]));

    expect(afterRemoval.tickerColorVars).toEqual({ MSFT: "--color-series-2" });
  });

  it("a new ticker takes a freed color-var slot rather than repainting survivors", () => {
    const withTwo = instrumentsReducer(
      { selectedTickers: [], tickerColorVars: {} },
      setSelectedTickers(["AAPL", "MSFT"]),
    );

    // Remove AAPL (frees --color-series-1), add GOOGL.
    const swapped = instrumentsReducer(withTwo, setSelectedTickers(["MSFT", "GOOGL"]));

    expect(swapped.tickerColorVars).toEqual({
      MSFT: "--color-series-2", // unchanged
      GOOGL: "--color-series-1", // took the freed slot
    });
  });
});
