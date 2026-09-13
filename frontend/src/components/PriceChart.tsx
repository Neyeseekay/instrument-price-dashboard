import { Chart } from "@highcharts/react";
import { LineSeries } from "@highcharts/react/series/Line";
import { useQueries } from "@tanstack/react-query";

import { getGetPricesQueryOptions } from "../api/generated/endpoints";
import { useAppSelector } from "../app/hooks";
import { SERIES_COLOR_VARS } from "../features/instruments/instrumentsSlice";
import { cssColor } from "../lib/cssColor";
import { Spinner } from "./ui/Spinner";

const CARD_CLASS = "rounded-lg border border-hairline bg-surface p-4 shadow-sm";

export function PriceChart() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);
  const tickerColorVars = useAppSelector((state) => state.instruments.tickerColorVars);

  const queries = useQueries({
    queries: selectedTickers.map((ticker) => getGetPricesQueryOptions(ticker)),
  });

  if (selectedTickers.length === 0) {
    return null;
  }

  if (queries.some((q) => q.isError)) {
    return (
      <div className={CARD_CLASS}>
        <p className="text-sm text-critical">
          Couldn&apos;t load price data. Check that the API is running and try again.
        </p>
      </div>
    );
  }

  if (queries.some((q) => q.isLoading)) {
    return (
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner />
          Loading chart...
        </div>
      </div>
    );
  }

  return (
    <div className={CARD_CLASS}>
      <Chart
        options={{
          chart: { backgroundColor: cssColor("--color-surface") },
          title: { text: undefined },
          credits: { enabled: false },
          tooltip: { shared: true, crosshairs: true },
          xAxis: {
            type: "datetime",
            gridLineColor: cssColor("--color-hairline"),
            labels: { style: { color: cssColor("--color-ink-muted") } },
          },
          yAxis: {
            title: { text: "Close Price", style: { color: cssColor("--color-ink-secondary") } },
            gridLineColor: cssColor("--color-hairline"),
            labels: { style: { color: cssColor("--color-ink-muted") } },
          },
          legend: {
            enabled: selectedTickers.length > 1,
            itemStyle: { color: cssColor("--color-ink-secondary") },
          },
        }}
      >
        {selectedTickers.map((ticker, i) => (
          <LineSeries
            key={ticker}
            name={ticker}
            color={cssColor(tickerColorVars[ticker] ?? SERIES_COLOR_VARS[0])}
            data={(queries[i]?.data?.series ?? []).map((point) => [
              Date.parse(point.date),
              point.price,
            ])}
            options={{
              lineWidth: 2,
              marker: { enabled: false, states: { hover: { enabled: true, radius: 5 } } },
            }}
          />
        ))}
      </Chart>
    </div>
  );
}
