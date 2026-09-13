import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useListInstruments } from "../api/generated/endpoints";
import { setSelectedTickers } from "../features/instruments/instrumentsSlice";
import { Combobox } from "./ui/Combobox";

export function TickerSearch() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);
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
        max={3}
        placeholder={isLoading ? "Loading tickers..." : "Search tickers..."}
        disabled={isLoading || isError}
      />

      {selectedTickers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {selectedTickers.map((ticker) => (
            <li
              key={ticker}
              className="flex items-center gap-1 rounded-full border border-hairline bg-page px-3 py-1 text-sm text-ink"
            >
              {ticker}
              <button
                type="button"
                onClick={() => handleRemove(ticker)}
                aria-label={`Remove ${ticker}`}
                className="text-ink-muted hover:text-critical"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
