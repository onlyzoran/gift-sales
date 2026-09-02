import type { Metadata } from "next";

import { AntdProvider } from "@/components/AntdProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gift Sales",
  description: "Агрегатор цен на подарочные карты",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
