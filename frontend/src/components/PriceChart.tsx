import { Chart } from "@highcharts/react";
import { LineSeries } from "@highcharts/react/series/Line";
import { useQueries } from "@tanstack/react-query";

import { getGetPricesQueryOptions } from "../api/generated/endpoints";
import { useAppSelector } from "../app/hooks";
import { cssColor } from "../lib/cssColor";
import { SERIES_COLOR_VARS } from "../features/instruments/instrumentsSlice";

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
      <p className="text-sm text-critical">
        Couldn&apos;t load price data. Check that the API is running and try again.
      </p>
    );
  }

  if (queries.some((q) => q.isLoading)) {
    return <p className="text-sm text-ink-muted">Loading chart...</p>;
  }

  return (
    <Chart
      options={{
        chart: { backgroundColor: cssColor("--color-surface") },
        tooltip: { shared: true, crosshairs: true },
        xAxis: {
          type: "datetime",
          gridLineColor: cssColor("--color-hairline"),
          labels: { style: { color: cssColor("--color-ink-muted") } },
        },
        yAxis: {
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
  );
}
