import { useQueries } from "@tanstack/react-query";

import { getGetPricesQueryOptions, getGetStatsQueryOptions } from "../api/generated/endpoints";
import { useAppSelector } from "../app/hooks";
import { SERIES_COLOR_VARS } from "../features/instruments/instrumentsSlice";
import { cssColor } from "../lib/cssColor";
import { Spinner } from "./ui/Spinner";

const CARD_CLASS = "rounded-lg border border-hairline bg-surface p-4 shadow-sm";

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function StatColumn({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="flex w-24 shrink-0 flex-col items-start gap-0.5">
      <span className="text-xs tracking-wide text-ink-muted uppercase">{label}</span>
      <span className={`font-medium ${colorClass ?? "text-ink"}`}>{value}</span>
    </div>
  );
}

export function StatsPanel() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);
  const tickerColorVars = useAppSelector((state) => state.instruments.tickerColorVars);

  const statsQueries = useQueries({
    queries: selectedTickers.map((ticker) => getGetStatsQueryOptions(ticker)),
  });
  // Same query PriceChart uses -- React Query dedupes identical query keys,
  // so this costs no extra network request when PriceChart is also mounted.
  const priceQueries = useQueries({
    queries: selectedTickers.map((ticker) => getGetPricesQueryOptions(ticker)),
  });

  if (selectedTickers.length === 0) {
    return null;
  }

  if (statsQueries.some((q) => q.isError) || priceQueries.some((q) => q.isError)) {
    return (
      <div className={CARD_CLASS}>
        <p className="text-sm text-critical">
          Couldn&apos;t load stats. Check that the API is running and try again.
        </p>
      </div>
    );
  }

  if (statsQueries.some((q) => q.isLoading) || priceQueries.some((q) => q.isLoading)) {
    return (
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner />
          Loading stats...
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {selectedTickers.map((ticker, i) => {
        const stats = statsQueries[i]?.data;
        const series = priceQueries[i]?.data?.series;
        if (!stats || !series) return null;

        const close = series.at(-1)?.price;
        const accentColor = cssColor(tickerColorVars[ticker] ?? SERIES_COLOR_VARS[0]);
        const returnColor =
          stats.totalReturnPct > 0
            ? "text-good"
            : stats.totalReturnPct < 0
              ? "text-critical"
              : "text-ink";
        const drawdownColor = stats.maxDrawdownPct < 0 ? "text-critical" : "text-ink";

        return (
          <li
            key={ticker}
            className="flex gap-4 overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm"
          >
            <span className="w-1 shrink-0" style={{ backgroundColor: accentColor }} aria-hidden="true" />
            <div className="flex flex-1 items-center gap-4 py-3 pr-4">
              <span className="font-semibold" style={{ color: accentColor }}>
                {ticker}
              </span>
              <div className="ml-auto flex gap-6">
                {close !== undefined && (
                  <StatColumn label="Close" value={`$${close.toFixed(2)}`} />
                )}
                <StatColumn label="Return" value={formatPct(stats.totalReturnPct)} colorClass={returnColor} />
                <StatColumn label="Volatility" value={`${stats.dailyVolatilityPct.toFixed(2)}%`} />
                <StatColumn
                  label="Drawdown"
                  value={`${stats.maxDrawdownPct.toFixed(2)}%`}
                  colorClass={drawdownColor}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
