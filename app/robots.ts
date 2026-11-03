import type { MetadataRoute } from "next";
import { AI_CRAWLERS, PRIVATE_PATHS, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // A crawler follows only its most specific group, so AI crawlers get the
  // same private-path rules as everyone else.
  const rule = { allow: "/", disallow: PRIVATE_PATHS };

  return {
    rules: [
      { userAgent: "*", ...rule },
      { userAgent: AI_CRAWLERS, ...rule },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
