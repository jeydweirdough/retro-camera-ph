"use server";

import { loadCatalog } from "@/lib/data/catalog";
import { getPromotions } from "@/lib/data/promotions";
import { Cart, MAX_QUANTITY_PER_LINE } from "@/lib/domain/cart";
import { readCart, saveCart } from "./cart-cookie";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Form values are untrusted: anything that isn't a sane integer becomes `fallback`. */
function quantityFrom(formData: FormData, fallback: number) {
  const n = Number(formData.get("quantity"));
  return Number.isInteger(n) && n >= 0 ? Math.min(n, MAX_QUANTITY_PER_LINE) : fallback;
}

const productIdFrom = (formData: FormData) => String(formData.get("productId") ?? "");

export async function addToCart(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const product = (await loadCatalog()).findById(productIdFrom(formData));
  if (!product) return { ok: false, message: "This product is no longer available." };
  if (!product.inStock) return { ok: false, message: `${product.name} is out of stock.` };

  const cart = await readCart();
  const quantity = Math.max(1, quantityFrom(formData, 1));
  const room = Math.min(product.stock, MAX_QUANTITY_PER_LINE) - cart.quantityOf(product.id);
  if (room <= 0) {
    return { ok: false, message: `You already have the most we can sell of ${product.name} in your cart.` };
  }

  try {
    cart.add(product.id, Math.min(quantity, room));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not add to cart." };
  }
  await saveCart(cart);
  return { ok: true, message: `Added ${product.name} to your cart.` };
}

export async function updateCartLine(formData: FormData) {
  const cart = await readCart();
  const productId = productIdFrom(formData);
  cart.setQuantity(productId, quantityFrom(formData, cart.quantityOf(productId)));
  await saveCart(cart);
}

export async function removeCartLine(formData: FormData) {
  const cart = await readCart();
  cart.remove(productIdFrom(formData));
  await saveCart(cart);
}

export async function applyPromoCode(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const code = Cart.normalizeCode(String(formData.get("code") ?? ""));
  if (!code) return { ok: false, message: "Enter a promo code." };

  const exists = (await getPromotions()).some((promotion) => promotion.code?.toUpperCase() === code);
  if (!exists) return { ok: false, message: `"${code}" isn't a valid promo code.` };

  const cart = await readCart();
  cart.applyCode(code);
  await saveCart(cart);
  return { ok: true, message: `Code ${code} added.` };
}

export async function removePromoCode() {
  const cart = await readCart();
  cart.removeCode();
  await saveCart(cart);
}
