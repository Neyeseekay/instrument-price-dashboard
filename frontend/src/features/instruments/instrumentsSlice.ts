import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface InstrumentsState {
  selectedTickers: string[];
}

const initialState: InstrumentsState = {
  selectedTickers: [],
};

const instrumentsSlice = createSlice({
  name: "instruments",
  initialState,
  reducers: {
    setSelectedTickers: (state, action: PayloadAction<string[]>) => {
      state.selectedTickers = action.payload;
    },
  },
});

export const { setSelectedTickers } = instrumentsSlice.actions;
export default instrumentsSlice.reducer;
