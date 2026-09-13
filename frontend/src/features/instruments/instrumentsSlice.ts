import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// CSS variable *names*, not resolved colors -- reducers must stay pure/no
// DOM access, so resolving these to actual hex values (via cssColor()) is
// a component-level concern, not a store concern.
export const SERIES_COLOR_VARS = ["--color-series-1", "--color-series-2", "--color-series-3"];

export interface InstrumentsState {
  selectedTickers: string[];
  tickerColorVars: Record<string, string>;
}

const initialState: InstrumentsState = {
  selectedTickers: [],
  tickerColorVars: {},
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
