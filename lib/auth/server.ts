import { createNeonAuth } from "@neon/auth/next/server";

/**
 * While prerendering a page's static shell, Next.js deliberately stops at
 * the first per-visitor value (cookies). The SDK logs that expected stop as
 * an error; every other message still gets through.
 */
const isPrerenderStop = (meta?: Record<string, unknown>) =>
  String(meta?.detail ?? "").startsWith("During prerendering");

const baseUrl = process.env.NEON_AUTH_BASE_URL ?? "";
if (!URL.canParse(baseUrl)) {
  console.error(
    "NEON_AUTH_BASE_URL is not a valid URL. Copy the Auth URL from the Neon Console " +
      "(your project → Auth → Settings → Project Info) into .env.local, then restart.",
  );
}

/** Neon's managed Better Auth. Users are stored in the `neon_auth` schema. */
export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    // "lax" (not the default "strict") so a customer who opens an order link
    // from an email or chat app arrives signed in.
    sameSite: "lax",
  },
  logger: {
    error: (message, meta) => {
      if (!isPrerenderStop(meta)) console.error(message, meta ?? "");
    },
    warn: (message, meta) => {
      if (!isPrerenderStop(meta)) console.warn(message, meta ?? "");
    },
  },
});
