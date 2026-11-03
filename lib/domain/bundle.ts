import type { BundleDTO } from "./dto";
import { DEFAULT_CURRENCY, Money, type Currency } from "./money";
import { PriceList } from "./price-list";
import { Product } from "./product";
import { worstCondition } from "./specs";

export interface BundleItem {
  product: Product;
  quantity: number;
}

/**
 * A kit of other products (e.g. body + lens + card). Its price and stock are
 * derived from its items, so they can never drift out of sync.
 */
export class Bundle extends Product {
  readonly type = "bundle";
  readonly items: readonly BundleItem[];
  readonly discountPercent: number;

  constructor(dto: BundleDTO, items: BundleItem[]) {
    Bundle.validate(items, dto.discountPercent);
    super(dto, {
      prices: Bundle.priceItems(items, dto.discountPercent),
      stock: Math.min(...items.map((item) => Math.floor(item.product.stock / item.quantity))),
      // A kit is only as good as its most worn item.
      condition: worstCondition(items.map((item) => item.product.condition)),
    });
    this.items = items;
    this.discountPercent = dto.discountPercent;
  }

  /** Price of the items bought separately, in the same currency as `price()`. */
  itemsTotal(currency: Currency = DEFAULT_CURRENCY) {
    return Bundle.sumItems(this.items, this.price(currency).currency);
  }

  compareAtPrice(currency: Currency = DEFAULT_CURRENCY) {
    return this.discountPercent > 0 ? this.itemsTotal(currency) : undefined;
  }

  /** A kit uses up its parts, not a "kit" unit of its own. */
  stockUnits(quantity: number): [string, number][] {
    return this.items.flatMap((item) => item.product.stockUnits(item.quantity * quantity));
  }

  savings(currency: Currency = DEFAULT_CURRENCY) {
    return this.itemsTotal(currency).subtract(this.price(currency));
  }

  getSpecs() {
    return [
      {
        label: "Includes",
        value: this.items.map((item) => `${item.quantity}× ${item.product.name}`).join(", "),
      },
      { label: "Bundle discount", value: `${this.discountPercent}%` },
    ];
  }

  toDTO(): BundleDTO {
    return {
      ...this.baseFields(),
      type: this.type,
      items: this.items.map((item) => ({
        product: item.product.toDTO(),
        quantity: item.quantity,
      })),
      discountPercent: this.discountPercent,
    };
  }

  /** Priced only in currencies every item has, so totals are never mixed. */
  private static priceItems(items: BundleItem[], discountPercent: number) {
    const currencies = items
      .map((item) => item.product.prices.currencies())
      .reduce((shared, next) => shared.filter((c) => next.includes(c)));

    return PriceList.fromMoney(
      currencies.map((currency) =>
        Bundle.sumItems(items, currency).percentOff(discountPercent),
      ),
    );
  }

  private static sumItems(items: readonly BundleItem[], currency: Currency) {
    return Money.sum(
      items.map((item) => item.product.price(currency).multiply(item.quantity)),
      currency,
    );
  }

  private static validate(items: BundleItem[], discountPercent: number) {
    if (items.length === 0) throw new RangeError("A bundle needs at least one item");
    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      throw new RangeError("Bundle item quantities must be whole numbers of at least 1");
    }
    if (discountPercent < 0 || discountPercent >= 100) {
      throw new RangeError("Bundle discount must be from 0 up to (not including) 100%");
    }
  }
}
