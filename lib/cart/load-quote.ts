import { connection } from "next/server";
import { loadCatalog } from "@/lib/data/catalog";
import { getPromotions } from "@/lib/data/promotions";
import { promotionFromDTO } from "@/lib/domain/promotion";
import { quoteCart } from "@/lib/domain/quote";
import { readCart } from "./cart-cookie";

/** The visitor's cart, priced on the server. Reads cookies, so call inside <Suspense>. */
export async function loadQuote() {
  const [cart, catalog, promotions] = await Promise.all([readCart(), loadCatalog(), getPromotions()]);
  // Promotions depend on today's date, so this must run per request, never prerendered.
  await connection();
  return { cart, quote: quoteCart(cart, catalog, promotions.map(promotionFromDTO), new Date()) };
}
