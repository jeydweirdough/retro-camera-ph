export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_LINES = 50;

/** What gets stored (in a cookie): IDs and quantities only, never prices. */
export interface CartJSON {
  lines: { productId: string; quantity: number }[];
  promoCode?: string;
}

const isPositiveInt = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0;

/**
 * The shopper's cart. Lines live in a private Map and only change through
 * methods that enforce the limits, so the cart can never hold bad data.
 * Prices are not stored here: they are always recalculated from the catalog.
 */
export class Cart {
  private readonly lines = new Map<string, number>();
  private code?: string;

  /** Tolerant of anything, since cookies can be edited by the user. */
  static fromJSON(json: unknown): Cart {
    const cart = new Cart();
    if (typeof json !== "object" || json === null) return cart;

    const { lines, promoCode } = json as Partial<CartJSON>;
    if (Array.isArray(lines)) {
      for (const line of lines.slice(0, MAX_LINES)) {
        if (typeof line?.productId === "string" && isPositiveInt(line.quantity)) {
          cart.add(line.productId, line.quantity);
        }
      }
    }
    if (typeof promoCode === "string") cart.applyCode(promoCode);
    return cart;
  }

  add(productId: string, quantity = 1) {
    if (!isPositiveInt(quantity)) throw new RangeError("Quantity must be a whole number above 0");
    if (!this.lines.has(productId) && this.lines.size >= MAX_LINES) {
      throw new RangeError(`A cart can hold at most ${MAX_LINES} different products`);
    }
    this.setQuantity(productId, (this.lines.get(productId) ?? 0) + quantity);
  }

  /** Setting 0 removes the line. Quantities above the limit are capped. */
  setQuantity(productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError("Quantity must be a whole number, 0 or more");
    }
    if (quantity === 0) this.lines.delete(productId);
    else this.lines.set(productId, Math.min(quantity, MAX_QUANTITY_PER_LINE));
  }

  remove(productId: string) {
    this.lines.delete(productId);
  }

  quantityOf(productId: string) {
    return this.lines.get(productId) ?? 0;
  }

  applyCode(code: string) {
    const normalized = Cart.normalizeCode(code);
    this.code = normalized || undefined;
  }

  removeCode() {
    this.code = undefined;
  }

  get promoCode() {
    return this.code;
  }

  entries(): [productId: string, quantity: number][] {
    return [...this.lines];
  }

  get itemCount() {
    let count = 0;
    for (const quantity of this.lines.values()) count += quantity;
    return count;
  }

  get isEmpty() {
    return this.lines.size === 0;
  }

  toJSON(): CartJSON {
    return {
      lines: this.entries().map(([productId, quantity]) => ({ productId, quantity })),
      ...(this.code && { promoCode: this.code }),
    };
  }

  /** Codes are case-insensitive: " welcome500 " → "WELCOME500". */
  static normalizeCode(code: string) {
    return code.trim().toUpperCase().slice(0, 32);
  }
}
