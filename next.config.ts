import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["grindroom.pages.dev"],
    },
  },
};

export default nextConfig;
