"use client";

import { Alert, Typography } from "antd";
import type { QuoteResponse } from "@gift-sales/storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BestPricesGrid } from "@/components/BestPricesGrid";
import { QuoteFilters, type QuoteFilterValues } from "@/components/QuoteFilters";
import {
  QuoteHistoryDrawer,
  type QuoteHistorySelection,
} from "@/components/QuoteHistoryDrawer";
import { QuotesTable } from "@/components/QuotesTable";
import {
  fetchBestQuotes,
  fetchQuotes,
  QuotesFetchError,
} from "@/lib/api/quotes-client";
import { formatFaceValue } from "@/lib/format";

const DEFAULT_BRAND = "apple";

const KNOWN_BRANDS = [
  { value: "apple", label: "Apple" },
  { value: "steam", label: "Steam" },
];

function toHistorySelection(quote: QuoteResponse): QuoteHistorySelection {
  return {
    brand: quote.brand,
    face_value: quote.face_value,
    face_currency: quote.face_currency,
    region: quote.region,
  };
}

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

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySelection, setHistorySelection] = useState<QuoteHistorySelection | null>(
    null,
  );

  const openHistory = useCallback((quote: QuoteResponse) => {
    setHistorySelection(toHistorySelection(quote));
    setHistoryOpen(true);
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
  }, []);

  const loadOptions = useCallback(async (brand: string) => {
    setOptionsLoading(true);
    setOptionsError(null);

    try {
      const quotes = await fetchQuotes({ brand });
      setOptionQuotes(quotes);
    } catch (error) {
      setOptionQuotes([]);
      setOptionsError(
        error instanceof QuotesFetchError ? error.message : "Не удалось загрузить фильтры",
      );
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const loadBest = useCallback(async (brand: string) => {
    setBestLoading(true);
    setBestError(null);

    try {
      const quotes = await fetchBestQuotes(brand);
      setBestQuotes(quotes);
    } catch (error) {
      setBestQuotes([]);
      setBestError(
        error instanceof QuotesFetchError
          ? error.message
          : "Не удалось загрузить лучшие цены",
      );
    } finally {
      setBestLoading(false);
    }
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
    void loadOptions(filters.brand);
    void loadBest(filters.brand);
  }, [filters.brand, loadBest, loadOptions]);

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
        <Typography.Title level={4}>Лучшие цены</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Нажмите на карточку, чтобы посмотреть историю цены по номиналу и региону.
        </Typography.Paragraph>
        <BestPricesGrid
          quotes={bestQuotes}
          loading={bestLoading || optionsLoading}
          onCardClick={openHistory}
        />
      </section>

      <section className="price-section">
        <Typography.Title level={4}>Все котировки</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Нажмите на строку, чтобы открыть график истории цены.
        </Typography.Paragraph>
        <QuotesTable
          quotes={tableQuotes}
          loading={tableLoading || optionsLoading}
          onRowClick={openHistory}
        />
      </section>

      <QuoteHistoryDrawer
        open={historyOpen}
        selection={historySelection}
        onClose={closeHistory}
      />
    </div>
  );
}
