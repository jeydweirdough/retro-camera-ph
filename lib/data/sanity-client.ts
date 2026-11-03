import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

let client: SanityClient | undefined;

/**
 * Read-only client for published content, served from Sanity's CDN.
 * Created on first use: `createClient` throws without a project ID, and
 * importing this file must stay safe when Sanity isn't configured.
 */
export function getSanityClient() {
  return (client ??= createClient({ projectId, dataset, apiVersion, useCdn: true }));
}
