"use client";

import { Typography } from "antd";

import { AppHeader } from "@/components/AppHeader";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <AppHeader />
      <Typography.Paragraph>
        Агрегатор цен на подарочные карты (Apple, Steam, …).
      </Typography.Paragraph>
    </main>
  );
}
