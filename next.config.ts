import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Security: disable server info leak
  poweredByHeader: false,
  // Prevent open redirects
  async redirects() {
    return [];
  },
};

export default nextConfig;
