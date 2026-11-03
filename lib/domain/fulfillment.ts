import { DEFAULT_CURRENCY, Money } from "./money";

/** Store-wide checkout settings, edited in Sanity. Amounts in centavos. */
export interface StoreSettingsDTO {
  deliveryFee: number;
  /** Orders at or above this total get free delivery. Omit for never. */
  freeDeliveryMinimum?: number;
  /** Omit to turn store pickup off. */
  pickup?: { address: string; hours?: string };
}

export type FulfillmentMethod = "pickup" | "delivery";

/**
 * How an order reaches the customer. Each option knows its own fee and
 * whether it needs a shipping address, so checkout just asks the object.
 */
export abstract class Fulfillment {
  abstract readonly method: FulfillmentMethod;
  abstract readonly label: string;

  /** Fee for an order whose discounted total is `orderTotal`. */
  abstract fee(orderTotal: Money): Money;

  /** One line for the checkout and the order page. */
  abstract describe(): string;

  get needsAddress() {
    return false;
  }
}

export class Pickup extends Fulfillment {
  readonly method = "pickup";
  readonly label = "Store pickup";

  constructor(
    readonly address: string,
    readonly hours?: string,
  ) {
    super();
  }

  fee() {
    return Money.zero(DEFAULT_CURRENCY);
  }

  describe() {
    return `Free pickup at ${this.address}${this.hours ? ` (${this.hours})` : ""}`;
  }
}

export class Delivery extends Fulfillment {
  readonly method = "delivery";
  readonly label = "Delivery";

  constructor(
    readonly flatFee: Money,
    readonly freeOver?: Money,
  ) {
    super();
  }

  get needsAddress() {
    return true;
  }

  fee(orderTotal: Money) {
    return this.freeOver && orderTotal.compare(this.freeOver) >= 0 ? Money.zero(DEFAULT_CURRENCY) : this.flatFee;
  }

  describe() {
    const base = `Delivery for ${this.flatFee.format()}`;
    return this.freeOver ? `${base}, free on orders of ${this.freeOver.format()} or more` : base;
  }
}

/** The options a shopper can choose, in display order. */
export function fulfillmentOptions(settings: StoreSettingsDTO): Fulfillment[] {
  const delivery = new Delivery(
    Money.ofMinor(settings.deliveryFee, DEFAULT_CURRENCY),
    settings.freeDeliveryMinimum !== undefined
      ? Money.ofMinor(settings.freeDeliveryMinimum, DEFAULT_CURRENCY)
      : undefined,
  );
  return settings.pickup
    ? [new Pickup(settings.pickup.address, settings.pickup.hours), delivery]
    : [delivery];
}
