export const CURRENCIES = {
  PHP: { locale: "en-PH", minorUnits: 2 },
  USD: { locale: "en-US", minorUnits: 2 },
} as const;

export type Currency = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: Currency = "PHP";

/** Plain money data, safe to pass to Client Components. */
export interface MoneyJSON {
  minor: number;
  currency: Currency;
}

/**
 * Immutable amount of money stored as an integer of minor units
 * (centavos, cents) so math never hits floating-point rounding errors.
 */
export class Money {
  private constructor(
    readonly minor: number,
    readonly currency: Currency,
  ) {
    if (!Number.isSafeInteger(minor)) {
      throw new RangeError(`Money must be a whole number of minor units, got ${minor}`);
    }
  }

  static ofMinor(minor: number, currency: Currency = DEFAULT_CURRENCY) {
    return new Money(minor, currency);
  }

  /** From a human amount like 139999.5 (as typed in Sanity) to minor units. */
  static fromMajor(amount: number, currency: Currency = DEFAULT_CURRENCY) {
    return new Money(Math.round(amount * 10 ** CURRENCIES[currency].minorUnits), currency);
  }

  static zero(currency: Currency = DEFAULT_CURRENCY) {
    return new Money(0, currency);
  }

  static sum(amounts: Money[], currency: Currency = DEFAULT_CURRENCY) {
    return amounts.reduce((total, m) => total.add(m), Money.zero(currency));
  }

  add(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.minor + other.minor, this.currency);
  }

  subtract(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.minor - other.minor, this.currency);
  }

  multiply(factor: number) {
    return new Money(Math.round(this.minor * factor), this.currency);
  }

  /** Amount after taking `percent` off, e.g. `.percentOff(10)` → 90%. */
  percentOff(percent: number) {
    return this.multiply(1 - percent / 100);
  }

  isZero() {
    return this.minor === 0;
  }

  isNegative() {
    return this.minor < 0;
  }

  compare(other: Money) {
    this.assertSameCurrency(other);
    return this.minor - other.minor;
  }

  equals(other: Money) {
    return this.currency === other.currency && this.minor === other.minor;
  }

  /** Decimal string for machines (JSON-LD, payment amounts): "49999.37". */
  toDecimalString() {
    return (this.minor / 10 ** CURRENCIES[this.currency].minorUnits).toFixed(
      CURRENCIES[this.currency].minorUnits,
    );
  }

  /** Display string for people: "₱49,999.37". */
  format(locale: string = CURRENCIES[this.currency].locale) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
    }).format(Number(this.toDecimalString()));
  }

  static fromJSON(json: MoneyJSON) {
    return new Money(json.minor, json.currency);
  }

  toJSON(): MoneyJSON {
    return { minor: this.minor, currency: this.currency };
  }

  private assertSameCurrency(other: Money) {
    if (other.currency !== this.currency) {
      throw new TypeError(`Cannot combine ${this.currency} with ${other.currency}`);
    }
  }
}
