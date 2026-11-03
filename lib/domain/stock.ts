import type { PricedLine } from "./promotion";

/** Total units per product an order uses, with kits broken into their parts. */
export function unitsNeeded(lines: readonly PricedLine[]): Map<string, number> {
  const units = new Map<string, number>();
  for (const line of lines) {
    for (const [productId, quantity] of line.product.stockUnits(line.quantity)) {
      units.set(productId, (units.get(productId) ?? 0) + quantity);
    }
  }
  return units;
}

export interface Shortage {
  productId: string;
  needed: number;
  available: number;
}

/** Products where on-hand stock minus other orders' holds can't cover `needed`. */
export function findShortages(
  needed: ReadonlyMap<string, number>,
  onHand: ReadonlyMap<string, number>,
  held: ReadonlyMap<string, number>,
): Shortage[] {
  const shortages: Shortage[] = [];
  for (const [productId, quantity] of needed) {
    const available = Math.max(0, (onHand.get(productId) ?? 0) - (held.get(productId) ?? 0));
    if (quantity > available) shortages.push({ productId, needed: quantity, available });
  }
  return shortages;
}
