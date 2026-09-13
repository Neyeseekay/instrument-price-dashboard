import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { parseTickersFromSearch } from "../../lib/tickerUrlParams";

// CSS variable *names*, not resolved colors -- reducers must stay pure/no
// DOM access, so resolving these to actual hex values (via cssColor()) is
// a component-level concern, not a store concern.
export const SERIES_COLOR_VARS = ["--color-series-1", "--color-series-2", "--color-series-3"];

export const MAX_SELECTED_TICKERS = SERIES_COLOR_VARS.length;

export interface InstrumentsState {
  selectedTickers: string[];
  tickerColorVars: Record<string, string>;
}

// Seeds the store from the `?tickers=` URL param (if present) so a shared
// link, or a refresh, lands on the same selection -- see useUrlTickerSync
// for the write side of this sync.
function initialSelectedTickers(): string[] {
  if (typeof window === "undefined") return [];
  return parseTickersFromSearch(window.location.search, MAX_SELECTED_TICKERS);
}

const seededTickers = initialSelectedTickers();

const initialState: InstrumentsState = {
  selectedTickers: seededTickers,
  tickerColorVars: assignColorVars(seededTickers, {}),
};

// A ticker keeps its assigned color-variable slot for as long as it stays
// selected, regardless of what's added/removed around it -- color follows
// the entity, never its position in the array.
function assignColorVars(
  selectedTickers: string[],
  existing: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const ticker of selectedTickers) {
    if (existing[ticker]) next[ticker] = existing[ticker];
  }
  for (const ticker of selectedTickers) {
    if (!next[ticker]) {
      const used = new Set(Object.values(next));
      const nextVar = SERIES_COLOR_VARS.find((v) => !used.has(v));
      if (nextVar) next[ticker] = nextVar;
    }
  }
  return next;
}

const instrumentsSlice = createSlice({
  name: "instruments",
  initialState,
  reducers: {
    setSelectedTickers: (state, action: PayloadAction<string[]>) => {
      state.selectedTickers = action.payload;
      state.tickerColorVars = assignColorVars(action.payload, state.tickerColorVars);
    },
  },
});

export const { setSelectedTickers } = instrumentsSlice.actions;
export default instrumentsSlice.reducer;
