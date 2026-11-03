import Link from "next/link";
import { readCart } from "@/lib/cart/cart-cookie";

function CartLinkView({ count }: { count?: number }) {
  return (
    <Link href="/cart" className="relative text-sm font-medium hover:text-brand-700 dark:hover:text-brand-400">
      Cart
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 rounded-full bg-brand-700 px-1.5 py-0.5 text-xs text-white tabular-nums">
          {count}
          <span className="sr-only"> {count === 1 ? "item" : "items"}</span>
        </span>
      )}
    </Link>
  );
}

/** Cart link with item count. Reads cookies, so render inside <Suspense>. */
export async function CartLink() {
  const cart = await readCart();
  return <CartLinkView count={cart.itemCount} />;
}

/** Shown while the count loads; the static page shell includes this. */
export function CartLinkFallback() {
  return <CartLinkView />;
}
