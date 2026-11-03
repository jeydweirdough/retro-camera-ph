import { DEFAULT_CURRENCY, Money } from "./money";
import type { Product } from "./product";

/**
 * What one unit of `product` cost the store. A kit costs the sum of its
 * parts (via `stockUnits`). Null when any part's cost is unknown, so reports
 * can say "cost missing" instead of showing a fake profit.
 */
export function unitCostOf(product: Product, costs: ReadonlyMap<string, number>): Money | null {
  let total = 0;
  for (const [productId, quantity] of product.stockUnits(1)) {
    const cost = costs.get(productId);
    if (cost === undefined) return null;
    total += cost * quantity;
  }
  return Money.ofMinor(total, DEFAULT_CURRENCY);
}
