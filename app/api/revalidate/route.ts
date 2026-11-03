import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { PRODUCTS_TAG } from "@/lib/data/catalog";
import { PAYMENT_METHODS_TAG, SETTINGS_TAG } from "@/lib/data/checkout-content";
import { CONTENT_TAG } from "@/lib/data/content";
import { PROMOTIONS_TAG } from "@/lib/data/promotions";

/** Which cached data each Sanity document type feeds. */
const TAGS_BY_TYPE: Record<string, string> = {
  camera: PRODUCTS_TAG,
  lens: PRODUCTS_TAG,
  accessory: PRODUCTS_TAG,
  bundle: PRODUCTS_TAG,
  promotion: PROMOTIONS_TAG,
  faq: CONTENT_TAG,
  paymentMethod: PAYMENT_METHODS_TAG,
  storeSettings: SETTINGS_TAG,
};

/**
 * Sanity calls this when content is published, so edits show up right away
 * instead of after the cache expires. The signature proves it's Sanity.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return new Response("SANITY_REVALIDATE_SECRET is not set", { status: 500 });

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret, true);
  if (!isValidSignature) return new Response("Invalid signature", { status: 401 });

  const tag = body?._type ? TAGS_BY_TYPE[body._type] : undefined;
  if (!tag) return Response.json({ revalidated: false, reason: "Type not cached" });

  revalidateTag(tag, "max");
  return Response.json({ revalidated: true, tag });
}
