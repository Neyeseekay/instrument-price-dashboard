import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useListInstruments } from "../api/generated/endpoints";
import {
  MAX_SELECTED_TICKERS,
  SERIES_COLOR_VARS,
  setSelectedTickers,
} from "../features/instruments/instrumentsSlice";
import { cssColor } from "../lib/cssColor";
import { Combobox } from "./ui/Combobox";

export function TickerSearch() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);
  const tickerColorVars = useAppSelector((state) => state.instruments.tickerColorVars);
  const dispatch = useAppDispatch();
  const { data: tickers, isLoading, isError } = useListInstruments();

  function handleRemove(ticker: string) {
    dispatch(setSelectedTickers(selectedTickers.filter((t) => t !== ticker)));
  }

  return (
    <div className="w-full">
      {isError && (
        <p className="mb-2 text-sm text-critical">
          Couldn&apos;t load tickers. Check that the API is running and try again.
        </p>
      )}

      <Combobox<string>
        options={tickers ?? []}
        getLabel={(ticker) => ticker}
        getValue={(ticker) => ticker}
        value={selectedTickers}
        onChange={(next) => dispatch(setSelectedTickers(next))}
        multiple
        max={MAX_SELECTED_TICKERS}
        placeholder={isLoading ? "Loading tickers..." : "Search tickers..."}
        disabled={isLoading || isError}
      />

      {selectedTickers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {selectedTickers.map((ticker) => {
            const accentColor = cssColor(tickerColorVars[ticker] ?? SERIES_COLOR_VARS[0]);
            return (
              <li
                key={ticker}
                className="flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 text-sm shadow-sm"
                style={{ borderColor: accentColor }}
              >
                <span className="font-medium" style={{ color: accentColor }}>
                  {ticker}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(ticker)}
                  aria-label={`Remove ${ticker}`}
                  className="text-ink-muted hover:text-critical"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
