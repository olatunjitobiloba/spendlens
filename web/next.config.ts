import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // qpdf-wasm (utils/pdf.ts) has Node-only requires behind a runtime check.
    resolveAlias: {
      fs: { browser: "./lib/shims/empty.ts" },
      path: { browser: "./lib/shims/empty.ts" },
      crypto: { browser: "./lib/shims/empty.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
