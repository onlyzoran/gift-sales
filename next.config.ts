import type { NextConfig } from "next";

const exportPreview = process.env.GIFT_SALES_OUTPUT === "export";

const nextConfig: NextConfig = {
  basePath: process.env.GIFT_SALES_BASE_PATH || "/gift-sales",
  trailingSlash: true,
  transpilePackages: ["antd", "@ant-design/icons", "@gift-sales/storage"],
  ...(exportPreview
    ? { output: "export" as const, images: { unoptimized: true } }
    : { serverExternalPackages: ["better-sqlite3"] }),
};

export default nextConfig;
