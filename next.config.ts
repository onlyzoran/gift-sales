import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/gift-sales",
  transpilePackages: ["antd", "@ant-design/icons"],
};

export default nextConfig;
