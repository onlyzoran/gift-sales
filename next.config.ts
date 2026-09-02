import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/gift-sales",
  trailingSlash: true,
  transpilePackages: ["antd", "@ant-design/icons"],
};

export default nextConfig;
