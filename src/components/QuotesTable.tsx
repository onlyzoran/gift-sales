"use client";

import { Empty, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { QuoteResponse } from "@gift-sales/storage";
import { LinkOutlined } from "@ant-design/icons";

import { formatDiscountPct, formatFaceValue, formatPriceRub } from "@/lib/format";

type QuotesTableProps = {
  quotes: QuoteResponse[];
  loading: boolean;
};

const columns: ColumnsType<QuoteResponse> = [
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
        <a href={record.source_url} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> Открыть
        </a>
      ) : (
        "—"
      ),
  },
];

export function QuotesTable({ quotes, loading }: QuotesTableProps) {
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
    />
  );
}
