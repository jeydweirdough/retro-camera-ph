import { CURRENCIES, DEFAULT_CURRENCY, Money, type Currency } from "./money";

/** Minor-unit prices per currency, as stored in Sanity. PHP is required. */
export type PriceMap = { [DEFAULT_CURRENCY]: number } & Partial<Record<Currency, number>>;

/** One product's prices, one per currency, with O(1) lookup. */
export class PriceList {
  private constructor(private readonly prices: ReadonlyMap<Currency, Money>) {
    if (!prices.has(DEFAULT_CURRENCY)) {
      throw new TypeError(`PriceList needs a ${DEFAULT_CURRENCY} price`);
    }
  }

  static fromMap(map: PriceMap) {
    const prices = new Map<Currency, Money>();
    for (const currency of Object.keys(CURRENCIES) as Currency[]) {
      const minor = map[currency];
      if (minor !== undefined) prices.set(currency, Money.ofMinor(minor, currency));
    }
    return new PriceList(prices);
  }

  static fromMoney(amounts: Money[]) {
    return new PriceList(new Map(amounts.map((m) => [m.currency, m])));
  }

  has(currency: Currency) {
    return this.prices.has(currency);
  }

  /** Price in `currency`, falling back to the default currency. */
  in(currency: Currency = DEFAULT_CURRENCY): Money {
    return this.prices.get(currency) ?? this.prices.get(DEFAULT_CURRENCY)!;
  }

  currencies() {
    return [...this.prices.keys()];
  }

  toJSON(): PriceMap {
    return Object.fromEntries(
      [...this.prices].map(([currency, m]) => [currency, m.minor]),
    ) as PriceMap;
  }
}
