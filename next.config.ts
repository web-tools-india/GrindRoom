import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["grindroom.workers.dev", "localhost:3000", "grindroom.in"],
    },
  },
};

export default nextConfig;
