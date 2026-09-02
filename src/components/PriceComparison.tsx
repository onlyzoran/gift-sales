"use client";

import { Alert, Typography } from "antd";
import type { QuoteResponse } from "@gift-sales/storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BestPricesGrid } from "@/components/BestPricesGrid";
import { QuoteFilters, type QuoteFilterValues } from "@/components/QuoteFilters";
import { QuotesTable } from "@/components/QuotesTable";
import { fetchBestQuotes, fetchQuotes, QuotesFetchError } from "@/lib/api/quotes-client";
import { formatFaceValue } from "@/lib/format";

const DEFAULT_BRAND = "apple";

const KNOWN_BRANDS = [
  { value: "apple", label: "Apple" },
  { value: "steam", label: "Steam" },
];

export function PriceComparison() {
  const [filters, setFilters] = useState<QuoteFilterValues>({ brand: DEFAULT_BRAND });
  const [optionQuotes, setOptionQuotes] = useState<QuoteResponse[]>([]);
  const [bestQuotes, setBestQuotes] = useState<QuoteResponse[]>([]);
  const [tableQuotes, setTableQuotes] = useState<QuoteResponse[]>([]);

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [bestLoading, setBestLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [bestError, setBestError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  const loadOptionsAndBest = useCallback(async (brand: string) => {
    setOptionsLoading(true);
    setBestLoading(true);
    setOptionsError(null);
    setBestError(null);

    const [optionsResult, bestResult] = await Promise.allSettled([
      fetchQuotes({ brand }),
      fetchBestQuotes(brand),
    ]);

    if (optionsResult.status === "fulfilled") {
      setOptionQuotes(optionsResult.value);
    } else {
      const error = optionsResult.reason;
      setOptionQuotes([]);
      setOptionsError(
        error instanceof QuotesFetchError ? error.message : "Не удалось загрузить фильтры",
      );
    }

    if (bestResult.status === "fulfilled") {
      setBestQuotes(bestResult.value);
    } else {
      const error = bestResult.reason;
      setBestQuotes([]);
      setBestError(
        error instanceof QuotesFetchError ? error.message : "Не удалось загрузить лучшие цены",
      );
    }

    setOptionsLoading(false);
    setBestLoading(false);
  }, []);

  const loadTable = useCallback(async (nextFilters: QuoteFilterValues) => {
    setTableLoading(true);
    setTableError(null);

    try {
      const quotes = await fetchQuotes(nextFilters);
      setTableQuotes(quotes);
    } catch (error) {
      setTableQuotes([]);
      setTableError(
        error instanceof QuotesFetchError ? error.message : "Не удалось загрузить котировки",
      );
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptionsAndBest(filters.brand);
  }, [filters.brand, loadOptionsAndBest]);

  useEffect(() => {
    void loadTable(filters);
  }, [filters, loadTable]);

  const brandOptions = useMemo(() => {
    const fromData = new Set(optionQuotes.map((quote) => quote.brand));
    const merged = new Map(KNOWN_BRANDS.map((item) => [item.value, item]));

    for (const brand of fromData) {
      if (!merged.has(brand)) {
        merged.set(brand, { value: brand, label: brand });
      }
    }

    return Array.from(merged.values());
  }, [optionQuotes]);

  const regionOptions = useMemo(() => {
    const regions = [...new Set(optionQuotes.map((quote) => quote.region))].sort((a, b) =>
      a.localeCompare(b, "ru"),
    );

    return regions.map((region) => ({ value: region, label: region }));
  }, [optionQuotes]);

  const faceValueOptions = useMemo(() => {
    const values = [
      ...new Set(optionQuotes.map((quote) => quote.face_value)),
    ].sort((a, b) => a - b);

    const currencyByValue = new Map<number, string>();
    for (const quote of optionQuotes) {
      currencyByValue.set(quote.face_value, quote.face_currency);
    }

    return values.map((value) => ({
      value,
      label: formatFaceValue(value, currencyByValue.get(value) ?? ""),
    }));
  }, [optionQuotes]);

  const handleFiltersChange = (nextFilters: QuoteFilterValues) => {
    if (nextFilters.brand !== filters.brand) {
      setFilters({
        brand: nextFilters.brand,
        region: undefined,
        faceValue: undefined,
      });
      return;
    }

    setFilters(nextFilters);
  };

  const visibleError = tableError ?? bestError ?? optionsError;

  return (
    <div className="price-comparison">
      <QuoteFilters
        brandOptions={brandOptions}
        regionOptions={regionOptions}
        faceValueOptions={faceValueOptions}
        values={filters}
        onChange={handleFiltersChange}
      />

      {visibleError && (
        <Alert
          type="error"
          showIcon
          message="Ошибка загрузки"
          description={visibleError}
          style={{ marginTop: 16 }}
        />
      )}

      <section className="price-section">
        <Typography.Title level={4}>Лучшая цена</Typography.Title>
        <BestPricesGrid quotes={bestQuotes} loading={bestLoading} />
      </section>

      <section className="price-section">
        <Typography.Title level={4}>Все котировки</Typography.Title>
        <QuotesTable quotes={tableQuotes} loading={tableLoading || optionsLoading} />
      </section>
    </div>
  );
}
