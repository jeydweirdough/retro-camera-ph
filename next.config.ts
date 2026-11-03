import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Receipt screenshots are up to 5 MB, plus room for form overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Tesseract starts worker scripts from its own folder, so it must not be bundled.
  serverExternalPackages: ["tesseract.js"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    loader: "custom",
    loaderFile: "./sanity/image-loader.ts",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
