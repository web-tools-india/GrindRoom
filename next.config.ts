import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["grindroom.nishantborse-2008.workers.dev", "localhost:3000", "grindroom.in"],
    },
  },
};

export default nextConfig;
