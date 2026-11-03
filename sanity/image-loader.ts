"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Resizes images on Sanity's CDN instead of Vercel's image optimizer,
 * so image traffic doesn't count against Vercel's limits.
 */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith("https://cdn.sanity.io/")) return src;

  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
}
