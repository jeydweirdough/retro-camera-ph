import { cacheLife, cacheTag } from "next/cache";
import { isSanityConfigured } from "@/sanity/env";
import { getSanityClient } from "./sanity-client";

export interface Faq {
  question: string;
  answer: string;
}

/** Tag to revalidate when editorial content changes in Sanity. */
export const CONTENT_TAG = "content";

/** Store FAQs. Written by the owner in Sanity; never invented in code. */
export async function getFaqs(): Promise<Faq[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  if (!isSanityConfigured) return [];
  return getSanityClient().fetch<Faq[]>(
    `*[_type == "faq" && defined(question) && defined(answer)] | order(sortOrder asc) { question, answer }`,
  );
}
