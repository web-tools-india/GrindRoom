import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["grindroom.pages.dev", "localhost:3000", "grindroom.app"],
    },
  },
};

export default nextConfig;
