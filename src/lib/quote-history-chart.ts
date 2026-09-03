import type { QuoteResponse } from "@gift-sales/storage";

export type QuoteHistoryChartPoint = {
  fetched_at: Date;
  price_rub: number;
  source: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function transformQuoteHistoryForChart(
  quotes: QuoteResponse[],
): QuoteHistoryChartPoint[] {
  return quotes.map((quote) => ({
    fetched_at: new Date(quote.fetched_at),
    price_rub: quote.price_rub,
    source: quote.source,
  }));
}

export function formatHistoryDateRange(quotes: QuoteResponse[]): string | null {
  if (quotes.length === 0) {
    return null;
  }

  const timestamps = quotes.map((quote) => new Date(quote.fetched_at).getTime());
  const min = new Date(Math.min(...timestamps));
  const max = new Date(Math.max(...timestamps));

  if (min.getTime() === max.getTime()) {
    return dateTimeFormatter.format(min);
  }

  return `${dateTimeFormatter.format(min)} — ${dateTimeFormatter.format(max)}`;
}
