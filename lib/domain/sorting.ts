import type { Currency } from "./money";
import type { Product } from "./product";

export interface SortStrategy {
  label: string;
  compare(a: Product, b: Product, currency: Currency): number;
}

/** Each sort option is a strategy; adding one is one entry here. */
export const SORTS = {
  featured: { label: "Featured", compare: () => 0 },
  "price-asc": {
    label: "Price: low to high",
    compare: (a, b, currency) => a.price(currency).compare(b.price(currency)),
  },
  "price-desc": {
    label: "Price: high to low",
    compare: (a, b, currency) => b.price(currency).compare(a.price(currency)),
  },
  name: { label: "Name: A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
} satisfies Record<string, SortStrategy>;

export type SortKey = keyof typeof SORTS;

export function isSortKey(value: string): value is SortKey {
  return Object.hasOwn(SORTS, value);
}
