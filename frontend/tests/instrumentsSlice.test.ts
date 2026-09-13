import { describe, expect, it } from "vitest";

import instrumentsReducer, {
  setSelectedTickers,
} from "../src/features/instruments/instrumentsSlice";

describe("instrumentsSlice", () => {
  it("has an empty selectedTickers array as the initial state", () => {
    const state = instrumentsReducer(undefined, { type: "@@INIT" });
    expect(state.selectedTickers).toEqual([]);
  });

  it("setSelectedTickers replaces the selection", () => {
    const state = instrumentsReducer(
      { selectedTickers: ["AAPL"] },
      setSelectedTickers(["MSFT", "GOOGL"]),
    );
    expect(state.selectedTickers).toEqual(["MSFT", "GOOGL"]);
  });

  it("setSelectedTickers can clear the selection", () => {
    const state = instrumentsReducer({ selectedTickers: ["AAPL"] }, setSelectedTickers([]));
    expect(state.selectedTickers).toEqual([]);
  });
});
