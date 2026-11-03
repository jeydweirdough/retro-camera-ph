// NEXT_PUBLIC_ so the embedded Studio (which runs in the browser) can read them.
// A project ID is not a secret; tokens must never use the NEXT_PUBLIC_ prefix.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2026-11-01";

export const isSanityConfigured = projectId !== "";
