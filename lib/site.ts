function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const site = {
  name: "Retro Camera PH",
  url: siteUrl(),
  description:
    "New and vintage cameras, film cameras, lenses and accessories, with a condition grade on every used item. Pay easily by QR code.",
  locale: "en_PH",
  /** Square logo, also used as the default social share image. */
  logo: "/brand/logo.png",
  /** Official profiles, linked from the footer and as schema.org `sameAs`. */
  social: {
    facebook: "https://www.facebook.com/RetroCamph",
  },
};

/** Pages search engines and AI crawlers should skip. */
export const PRIVATE_PATHS = ["/studio", "/cart", "/checkout", "/account", "/admin", "/auth", "/api/"];

/** AI crawlers explicitly welcomed in robots.txt (AEO). */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
