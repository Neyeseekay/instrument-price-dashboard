import { useQueries } from "@tanstack/react-query";
import type { ChartData, ChartOptions } from "chart.js";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";

import { getGetPricesQueryOptions } from "../api/generated/endpoints";
import { useAppSelector } from "../app/hooks";
import { cssColor } from "../lib/cssColor";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const SERIES_COLOR_VARS = ["--color-series-1", "--color-series-2", "--color-series-3"];

export function PriceChart() {
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);

  const queries = useQueries({
    queries: selectedTickers.map((ticker) => getGetPricesQueryOptions(ticker)),
  });

  const seriesColors = useMemo(() => SERIES_COLOR_VARS.map(cssColor), []);

  // Stable per-ticker color assignment: a ticker keeps its color for as long
  // as it stays selected, regardless of what else gets added/removed around
  // it. Color follows the entity, never its position in the array.
  const colorAssignmentsRef = useRef<Map<string, string>>(new Map());
  const colorByTicker = useMemo(() => {
    const assignments = colorAssignmentsRef.current;
    for (const ticker of [...assignments.keys()]) {
      if (!selectedTickers.includes(ticker)) assignments.delete(ticker);
    }
    for (const ticker of selectedTickers) {
      if (!assignments.has(ticker)) {
        const used = new Set(assignments.values());
        const nextColor = seriesColors.find((c) => !used.has(c));
        if (nextColor) assignments.set(ticker, nextColor);
      }
    }
    return assignments;
  }, [selectedTickers, seriesColors]);

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

  const labels = queries[0]?.data?.series.map((point) => point.date) ?? [];

  const data: ChartData<"line"> = {
    labels,
    datasets: selectedTickers.map((ticker, i) => {
      const color = colorByTicker.get(ticker) ?? seriesColors[0];
      return {
        label: ticker,
        data: queries[i]?.data?.series.map((point) => point.price) ?? [],
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.15,
      };
    }),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: selectedTickers.length > 1,
        labels: {
          color: cssColor("--color-ink-secondary"),
        },
      },
    },
    scales: {
      x: {
        grid: { color: cssColor("--color-hairline") },
        ticks: { color: cssColor("--color-ink-muted") },
      },
      y: {
        grid: { color: cssColor("--color-hairline") },
        ticks: { color: cssColor("--color-ink-muted") },
      },
    },
  };

  return <Line data={data} options={options} />;
}
