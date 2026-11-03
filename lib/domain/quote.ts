import type { Cart } from "./cart";
import type { Catalog } from "./catalog";
import { DEFAULT_CURRENCY, Money } from "./money";
import type { PricedLine, Promotion } from "./promotion";

export type CartIssue =
  | { kind: "unavailable"; productId: string }
  | { kind: "out-of-stock"; productId: string; name: string }
  | { kind: "reduced"; productId: string; name: string; available: number };

export interface AppliedDiscount {
  promotion: Promotion;
  amount: Money;
}

export type CodeStatus = "none" | "applied" | "unknown" | "not-eligible";

export interface Quote {
  lines: PricedLine[];
  subtotal: Money;
  discounts: AppliedDiscount[];
  discountTotal: Money;
  total: Money;
  itemCount: number;
  issues: CartIssue[];
  codeStatus: CodeStatus;
}

/**
 * Prices a cart from the catalog, in PHP (the currency customers pay in).
 * Nothing in the cart itself is trusted: prices and stock come from the
 * catalog, and every promotion's rules are checked here.
 *
 * Stacking: every eligible automatic promotion, plus the entered code.
 */
export function quoteCart(
  cart: Cart,
  catalog: Catalog,
  promotions: readonly Promotion[],
  now: Date,
): Quote {
  const lines: PricedLine[] = [];
  const issues: CartIssue[] = [];

  for (const [productId, wanted] of cart.entries()) {
    const product = catalog.findById(productId);
    if (!product) {
      issues.push({ kind: "unavailable", productId });
      continue;
    }
    if (!product.inStock) {
      issues.push({ kind: "out-of-stock", productId, name: product.name });
      continue;
    }

    const quantity = Math.min(wanted, product.stock);
    if (quantity < wanted) {
      issues.push({ kind: "reduced", productId, name: product.name, available: product.stock });
    }

    const unitPrice = product.price(DEFAULT_CURRENCY);
    lines.push({ product, quantity, unitPrice, total: unitPrice.multiply(quantity) });
  }

  const subtotal = Money.sum(lines.map((line) => line.total));
  const context = { lines, subtotal, now };

  const codePromotion = cart.promoCode
    ? promotions.find((promotion) => promotion.code === cart.promoCode)
    : undefined;

  const discounts = [...promotions.filter((p) => p.isAutomatic), ...(codePromotion ? [codePromotion] : [])]
    .map((promotion) => ({ promotion, amount: promotion.discount(context) }))
    .filter((discount) => !discount.amount.isZero());

  const discountTotal = Money.sum(discounts.map((d) => d.amount));
  const total = discountTotal.compare(subtotal) > 0 ? Money.zero() : subtotal.subtract(discountTotal);

  return {
    lines,
    subtotal,
    discounts,
    discountTotal: subtotal.subtract(total),
    total,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    issues,
    codeStatus: !cart.promoCode
      ? "none"
      : !codePromotion
        ? "unknown"
        : discounts.some((d) => d.promotion === codePromotion)
          ? "applied"
          : "not-eligible",
  };
}
