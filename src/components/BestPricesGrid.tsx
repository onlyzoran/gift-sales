"use client";

import { Card, Col, Empty, Row, Skeleton, Typography } from "antd";
import type { QuoteResponse } from "@gift-sales/storage";
import { LinkOutlined } from "@ant-design/icons";

import { formatDiscountPct, formatFaceValue, formatPriceRub } from "@/lib/format";
import { formatNominalUnitPrice } from "@/lib/nominal-unit-price";

type BestPricesGridProps = {
  quotes: QuoteResponse[];
  loading: boolean;
  onCardClick?: (quote: QuoteResponse) => void;
};

export function BestPricesGrid({ quotes, loading, onCardClick }: BestPricesGridProps) {
  if (loading) {
    return (
      <Row gutter={[12, 12]}>
        {Array.from({ length: 4 }, (_, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Card size="small">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (quotes.length === 0) {
    return (
      <Empty
        description="Нет котировок для выбранного бренда"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Row gutter={[12, 12]}>
      {quotes.map((quote) => (
        <Col
          key={`${quote.region}-${quote.face_value}-${quote.face_currency}`}
          xs={24}
          sm={12}
          md={8}
          lg={6}
        >
          <Card
            size="small"
            hoverable
            onClick={() => onCardClick?.(quote)}
            style={onCardClick ? { cursor: "pointer" } : undefined}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {quote.region}
            </Typography.Text>
            <Typography.Title level={5} style={{ margin: "4px 0 8px" }}>
              {formatFaceValue(quote.face_value, quote.face_currency)}
            </Typography.Title>
            <Typography.Text strong style={{ fontSize: 18 }}>
              {formatPriceRub(quote.price_rub)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
              {formatNominalUnitPrice(quote.price_rub, quote.face_value, quote.face_currency)}
            </Typography.Text>
            <div style={{ marginTop: 4 }}>
              <Typography.Text type="secondary">
                {quote.source}
                {quote.discount_pct !== null && (
                  <> · скидка {formatDiscountPct(quote.discount_pct)}</>
                )}
              </Typography.Text>
            </div>
            {quote.source_url && (
              <Typography.Link
                href={quote.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 8, display: "inline-block" }}
                onClick={(event) => event.stopPropagation()}
              >
                <LinkOutlined /> В магазин
              </Typography.Link>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
