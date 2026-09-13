import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setSelectedTickers } from "../features/instruments/instrumentsSlice";
import { Combobox } from "./ui/Combobox";

// TEMPORARY mock data -- replace with the generated useGetInstrumentsQuery()
// hook once the Orval pipeline is wired up. Matches the real TICK#### naming
// so nothing about this component changes shape when that swap happens.
const MOCK_TICKERS = Array.from({ length: 20 }, (_, i) => `TICK${String(i + 1).padStart(4, "0")}`);

export function TickerSearch() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);
  const dispatch = useAppDispatch();

  function handleRemove(ticker: string) {
    dispatch(setSelectedTickers(selectedTickers.filter((t) => t !== ticker)));
  }

  return (
    <div className="w-full">
      <Combobox<string>
        options={MOCK_TICKERS}
        getLabel={(ticker) => ticker}
        getValue={(ticker) => ticker}
        value={selectedTickers}
        onChange={(next) => dispatch(setSelectedTickers(next))}
        multiple
        max={3}
        placeholder="Search tickers..."
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
