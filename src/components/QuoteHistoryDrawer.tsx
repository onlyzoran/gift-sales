"use client";

import { Alert, Button, Drawer, Empty, Skeleton, Typography } from "antd";
import type { QuoteResponse } from "@gift-sales/storage";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { fetchQuoteHistory, QuotesFetchError } from "@/lib/api/quotes-client";
import { formatFaceValue } from "@/lib/format";
import { formatHistoryDateRange } from "@/lib/quote-history-chart";

const PriceHistoryChart = dynamic(
  () =>
    import("@/components/PriceHistoryChart").then((module) => module.PriceHistoryChart),
  {
    ssr: false,
    loading: () => <Skeleton active paragraph={{ rows: 6 }} />,
  },
);

export type QuoteHistorySelection = {
  brand: string;
  face_value: number;
  face_currency: string;
  region: string;
};

type QuoteHistoryDrawerProps = {
  open: boolean;
  selection: QuoteHistorySelection | null;
  onClose: () => void;
};

type LoadState = "idle" | "loading" | "success" | "error";

export function QuoteHistoryDrawer({
  open,
  selection,
  onClose,
}: QuoteHistoryDrawerProps) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!selection) {
      return;
    }

    setLoadState("loading");
    setErrorMessage(null);

    try {
      const history = await fetchQuoteHistory({
        brand: selection.brand,
        faceValue: selection.face_value,
        region: selection.region,
      });
      setQuotes(history);
      setLoadState("success");
    } catch (error) {
      setQuotes([]);
      setErrorMessage(
        error instanceof QuotesFetchError
          ? error.message
          : "Не удалось загрузить историю цены",
      );
      setLoadState("error");
    }
  }, [selection]);

  useEffect(() => {
    if (open && selection) {
      void loadHistory();
    }
  }, [open, selection, loadHistory]);

  useEffect(() => {
    if (!open) {
      setLoadState("idle");
      setQuotes([]);
      setErrorMessage(null);
    }
  }, [open]);

  const title = selection
    ? `${formatFaceValue(selection.face_value, selection.face_currency)} · ${selection.region}`
    : "История цены";

  const dateRange = formatHistoryDateRange(quotes);

  return (
    <Drawer
      title={title}
      placement="right"
      width={640}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {selection && loadState === "success" && dateRange && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Период данных: {dateRange}
        </Typography.Paragraph>
      )}

      {loadState === "loading" && <Skeleton active paragraph={{ rows: 8 }} />}

      {loadState === "error" && (
        <Alert
          type="error"
          showIcon
          message="Ошибка загрузки истории"
          description={errorMessage ?? "Попробуйте повторить запрос"}
          action={
            <Button size="small" onClick={() => void loadHistory()}>
              Повторить
            </Button>
          }
        />
      )}

      {loadState === "success" && quotes.length === 0 && (
        <Empty description="Истории пока нет" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {loadState === "success" && quotes.length > 0 && (
        <PriceHistoryChart quotes={quotes} />
      )}
    </Drawer>
  );
}
