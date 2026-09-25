import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default function config(phase: string): NextConfig {
  return {
    ...nextConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"
  };
}
