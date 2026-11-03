import { CATEGORIES } from "./categories";
import type { ProductType } from "./dto";
import { DEFAULT_CURRENCY, Money } from "./money";
import type { Product } from "./product";

/** A priced cart line, as promotions see it. */
export interface PricedLine {
  product: Product;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface PromotionContext {
  lines: readonly PricedLine[];
  subtotal: Money;
  now: Date;
}

interface PromotionFieldsDTO {
  id: string;
  title: string;
  /** Empty = applied automatically to every eligible cart. */
  code?: string;
  startsAt?: string;
  endsAt?: string;
  /** Minimum cart subtotal in centavos (0 = none). */
  minSubtotal: number;
}

export interface PercentOffDTO extends PromotionFieldsDTO {
  type: "percentOff";
  percent: number;
  /** Product types it applies to; empty = everything. */
  appliesTo: ProductType[];
}

export interface FixedOffDTO extends PromotionFieldsDTO {
  type: "fixedOff";
  /** Centavos off the whole cart. */
  amount: number;
}

export interface BuyXGetYDTO extends PromotionFieldsDTO {
  type: "buyXGetY";
  productId: string;
  buy: number;
  get: number;
}

export type PromotionDTO = PercentOffDTO | FixedOffDTO | BuyXGetYDTO;

/**
 * Base of every promotion. Shared rules (dates, minimum spend, codes) live
 * here; each subclass only says how much it takes off (`discount`) and how
 * to describe itself to shoppers (`describe`). Amounts are in PHP, the
 * currency customers pay in.
 */
export abstract class Promotion {
  readonly id: string;
  readonly title: string;
  readonly code?: string;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly minSubtotal: Money;

  protected constructor(dto: PromotionFieldsDTO) {
    this.id = dto.id;
    this.title = dto.title;
    this.code = dto.code ? dto.code.trim().toUpperCase() : undefined;
    this.startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
    this.endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    this.minSubtotal = Money.ofMinor(dto.minSubtotal, DEFAULT_CURRENCY);
  }

  /** Amount taken off this cart, before eligibility rules. Never negative. */
  protected abstract amountOff(context: PromotionContext): Money;

  /** Short shopper-facing summary, e.g. "10% off Lenses". */
  abstract describe(): string;

  get isAutomatic() {
    return this.code === undefined;
  }

  isActive(now: Date) {
    return (!this.startsAt || now >= this.startsAt) && (!this.endsAt || now <= this.endsAt);
  }

  meetsMinimum(subtotal: Money) {
    return subtotal.compare(this.minSubtotal) >= 0;
  }

  /** What this promotion takes off the cart right now (zero if it doesn't apply). */
  discount(context: PromotionContext): Money {
    if (!this.isActive(context.now) || !this.meetsMinimum(context.subtotal)) {
      return Money.zero(DEFAULT_CURRENCY);
    }
    const amount = this.amountOff(context);
    // Never take off more than the cart is worth.
    return amount.compare(context.subtotal) > 0 ? context.subtotal : amount;
  }
}

export class PercentOff extends Promotion {
  readonly percent: number;
  readonly appliesTo: readonly ProductType[];

  constructor(dto: PercentOffDTO) {
    super(dto);
    this.percent = dto.percent;
    this.appliesTo = [...dto.appliesTo];
  }

  protected amountOff({ lines }: PromotionContext) {
    const eligible = lines.filter(
      (line) => this.appliesTo.length === 0 || this.appliesTo.includes(line.product.type),
    );
    return Money.sum(eligible.map((line) => line.total)).multiply(this.percent / 100);
  }

  describe() {
    const scope =
      this.appliesTo.length === 0
        ? "everything"
        : this.appliesTo.map((type) => CATEGORIES[type].label).join(" and ");
    return `${this.percent}% off ${scope}`;
  }
}

export class FixedOff extends Promotion {
  readonly amount: Money;

  constructor(dto: FixedOffDTO) {
    super(dto);
    this.amount = Money.ofMinor(dto.amount, DEFAULT_CURRENCY);
  }

  protected amountOff() {
    return this.amount;
  }

  describe() {
    return `${this.amount.format()} off your order`;
  }
}

export class BuyXGetY extends Promotion {
  readonly productId: string;
  readonly buy: number;
  readonly get: number;

  constructor(dto: BuyXGetYDTO) {
    super(dto);
    this.productId = dto.productId;
    this.buy = dto.buy;
    this.get = dto.get;
  }

  /** Buy 2 get 1: every group of 3 has 1 free. */
  protected amountOff({ lines }: PromotionContext) {
    const line = lines.find((l) => l.product.id === this.productId);
    if (!line) return Money.zero(DEFAULT_CURRENCY);
    const free = Math.floor(line.quantity / (this.buy + this.get)) * this.get;
    return line.unitPrice.multiply(free);
  }

  describe() {
    return `Buy ${this.buy}, get ${this.get} free`;
  }
}

type Builders = {
  [T in PromotionDTO["type"]]: (dto: Extract<PromotionDTO, { type: T }>) => Promotion;
};

const builders: Builders = {
  percentOff: (dto) => new PercentOff(dto),
  fixedOff: (dto) => new FixedOff(dto),
  buyXGetY: (dto) => new BuyXGetY(dto),
};

export function promotionFromDTO(dto: PromotionDTO): Promotion {
  const build = builders[dto.type] as (dto: PromotionDTO) => Promotion;
  return build(dto);
}
