"use client";

import { Line } from "@ant-design/plots";
import type { QuoteResponse } from "@gift-sales/storage";
import { useMemo } from "react";

import { formatPriceRub } from "@/lib/format";
import { transformQuoteHistoryForChart } from "@/lib/quote-history-chart";

type PriceHistoryChartProps = {
  quotes: QuoteResponse[];
};

export function PriceHistoryChart({ quotes }: PriceHistoryChartProps) {
  const data = useMemo(() => transformQuoteHistoryForChart(quotes), [quotes]);

  return (
    <Line
      data={data}
      xField="fetched_at"
      yField="price_rub"
      seriesField="source"
      height={320}
      autoFit
      smooth
      legend={{ position: "top" }}
      xAxis={{
        type: "time",
        tickCount: 5,
      }}
      yAxis={{
        label: {
          formatter: (value: string) => formatPriceRub(Number(value)),
        },
      }}
      tooltip={{
        title: (value: Date) =>
          value.toLocaleString("ru-RU", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        formatter: (datum: { source: string; price_rub: number }) => ({
          name: datum.source,
          value: formatPriceRub(datum.price_rub),
        }),
      }}
    />
  );
}
