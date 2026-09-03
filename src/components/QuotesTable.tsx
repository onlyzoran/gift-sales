"use client";

import { Empty, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { QuoteResponse } from "@gift-sales/storage";
import { LinkOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { useMemo } from "react";

import { formatDiscountPct, formatFaceValue, formatPriceRub } from "@/lib/format";
import {
  compareNominalUnitPrice,
  formatNominalUnitPrice,
  nominalUnitPriceColumnTitle,
} from "@/lib/nominal-unit-price";

type QuotesTableProps = {
  quotes: QuoteResponse[];
  loading: boolean;
  onRowClick?: (quote: QuoteResponse) => void;
};

const NOMINAL_UNIT_PRICE_TOOLTIP = "Сколько рублей стоит 1 единица номинала карты";

export function QuotesTable({ quotes, loading, onRowClick }: QuotesTableProps) {
  const columns = useMemo<ColumnsType<QuoteResponse>>(() => {
    const title = nominalUnitPriceColumnTitle(quotes.map((quote) => quote.face_currency));

    return [
      {
        title: "Номинал",
        key: "face_value",
        render: (_, record) => formatFaceValue(record.face_value, record.face_currency),
        sorter: (a, b) => a.face_value - b.face_value,
      },
      {
        title: "Регион",
        dataIndex: "region",
        key: "region",
        sorter: (a, b) => a.region.localeCompare(b.region, "ru"),
      },
      {
        title: "Источник",
        dataIndex: "source",
        key: "source",
        sorter: (a, b) => a.source.localeCompare(b.source, "ru"),
      },
      {
        title: "Цена",
        dataIndex: "price_rub",
        key: "price_rub",
        render: (value: number) => formatPriceRub(value),
        sorter: (a, b) => a.price_rub - b.price_rub,
        defaultSortOrder: "ascend",
      },
      {
        title: (
          <span>
            {title}{" "}
            <Tooltip title={NOMINAL_UNIT_PRICE_TOOLTIP}>
              <QuestionCircleOutlined aria-label={NOMINAL_UNIT_PRICE_TOOLTIP} />
            </Tooltip>
          </span>
        ),
        key: "nominal_unit_price",
        render: (_, record) =>
          formatNominalUnitPrice(record.price_rub, record.face_value, record.face_currency),
        sorter: (a, b, sortOrder) =>
          compareNominalUnitPrice(
            a.price_rub,
            a.face_value,
            b.price_rub,
            b.face_value,
            sortOrder,
          ),
      },
      {
        title: "Скидка",
        dataIndex: "discount_pct",
        key: "discount_pct",
        render: (value: number | null) => formatDiscountPct(value),
        sorter: (a, b) => (a.discount_pct ?? -1) - (b.discount_pct ?? -1),
      },
      {
        title: "Магазин",
        key: "source_url",
        render: (_, record) =>
          record.source_url ? (
            <a
              href={record.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <LinkOutlined /> Открыть
            </a>
          ) : (
            "—"
          ),
      },
    ];
  }, [quotes]);

  if (!loading && quotes.length === 0) {
    return (
      <Empty
        description="Котировки не найдены по выбранным фильтрам"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      rowKey={(record) =>
        `${record.region}-${record.face_value}-${record.source}-${record.price_rub}`
      }
      columns={columns}
      dataSource={quotes}
      loading={loading}
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
      scroll={{ x: "max-content" }}
      size="middle"
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: onRowClick ? { cursor: "pointer" } : undefined,
      })}
    />
  );
}
