"use client";

import { Typography } from "antd";

import { AppHeader } from "@/components/AppHeader";
import { PriceComparison } from "@/components/PriceComparison";

export default function HomePage() {
  return (
    <main className="page-main">
      <AppHeader />
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Сравнение цен на подарочные карты из нескольких магазинов.
      </Typography.Paragraph>
      <PriceComparison />
    </main>
  );
}
