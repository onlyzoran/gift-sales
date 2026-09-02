import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/gift-sales",
  trailingSlash: true,
  transpilePackages: ["antd", "@ant-design/icons", "@gift-sales/storage"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
