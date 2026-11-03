import { cookies } from "next/headers";
import { Cart } from "@/lib/domain/cart";

const COOKIE = "cart";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** The visitor's cart. Anything unreadable becomes an empty cart. */
export async function readCart(): Promise<Cart> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return new Cart();
  try {
    return Cart.fromJSON(JSON.parse(value));
  } catch {
    return new Cart();
  }
}

/** Only callable from Server Actions / Route Handlers (cookies can't be set while streaming). */
export async function saveCart(cart: Cart) {
  const store = await cookies();
  if (cart.isEmpty && !cart.promoCode) {
    store.delete(COOKIE);
    return;
  }
  store.set(COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}
