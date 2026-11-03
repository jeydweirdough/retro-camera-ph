import { describe, expect, it } from "vitest";
import { cardsBuy2Get1, lensWeek, samplePromotions, welcomeCode } from "@/lib/data/sample-promotions";
import {
  canonR6II,
  canonRf24105,
  sampleProducts,
  sdCard128,
  sony50f18,
  sonyA7IV,
} from "@/lib/data/sample-repository";
import { Cart } from "./cart";
import { Catalog } from "./catalog";
import { promotionFromDTO } from "./promotion";
import { quoteCart } from "./quote";

const catalog = Catalog.fromDTOs(sampleProducts);
const promotions = samplePromotions.map(promotionFromDTO);
const now = new Date("2026-11-02T12:00:00Z");

function cartWith(lines: [string, number][], code?: string) {
  const cart = new Cart();
  for (const [id, quantity] of lines) cart.add(id, quantity);
  if (code) cart.applyCode(code);
  return cart;
}

describe("quoteCart", () => {
  it("prices lines from the catalog, in PHP", () => {
    const quote = quoteCart(cartWith([[sony50f18.id, 2]]), catalog, [], now);
    expect(quote.subtotal.format()).toBe("₱29,998.00");
    expect(quote.total.equals(quote.subtotal)).toBe(true);
    expect(quote.itemCount).toBe(2);
  });

  it("applies automatic promotions (buy 2 cards, get 1 free)", () => {
    const quote = quoteCart(cartWith([[sdCard128.id, 3]]), catalog, promotions, now);
    expect(quote.discounts.map((d) => d.promotion.id)).toEqual([cardsBuy2Get1.id]);
    expect(quote.discountTotal.format()).toBe("₱1,999.00");
    expect(quote.total.format()).toBe("₱3,998.00");
  });

  it("applies a code only when its rules are met", () => {
    const small = quoteCart(cartWith([[sdCard128.id, 1]], "welcome500"), catalog, promotions, now);
    expect(small.codeStatus).toBe("not-eligible"); // under the ₱10,000 minimum
    expect(small.discounts).toEqual([]);

    const big = quoteCart(cartWith([[sonyA7IV.id, 1]], "WELCOME500"), catalog, promotions, now);
    expect(big.codeStatus).toBe("applied");
    expect(big.total.format()).toBe("₱139,499.00");
  });

  it("limits percent-off codes to their categories", () => {
    const quote = quoteCart(
      cartWith([[sonyA7IV.id, 1], [canonRf24105.id, 1]], lensWeek.code),
      catalog,
      promotions,
      now,
    );
    // 10% of the lens only: ₱69,999 → ₱6,999.90 off
    expect(quote.discountTotal.format()).toBe("₱6,999.90");
  });

  it("flags unknown codes", () => {
    const quote = quoteCart(cartWith([[sonyA7IV.id, 1]], "NOPE"), catalog, promotions, now);
    expect(quote.codeStatus).toBe("unknown");
  });

  it("ignores promotions outside their dates", () => {
    const expired = promotionFromDTO({ ...welcomeCode, endsAt: "2026-01-01T00:00:00Z" });
    const quote = quoteCart(cartWith([[sonyA7IV.id, 1]], welcomeCode.code), catalog, [expired], now);
    expect(quote.codeStatus).toBe("not-eligible");
  });

  it("never discounts below zero", () => {
    const huge = promotionFromDTO({ ...welcomeCode, code: undefined, minSubtotal: 0, amount: 999_999_00 });
    const quote = quoteCart(cartWith([[sdCard128.id, 1]]), catalog, [huge], now);
    expect(quote.total.isZero()).toBe(true);
    expect(quote.discountTotal.equals(quote.subtotal)).toBe(true);
  });

  it("caps quantities at stock and reports problems", () => {
    // Canon R6 II has 2 in stock.
    const quote = quoteCart(cartWith([[canonR6II.id, 5], ["deleted-product", 1]]), catalog, [], now);
    expect(quote.lines[0].quantity).toBe(2);
    expect(quote.issues).toEqual([
      { kind: "reduced", productId: canonR6II.id, name: canonR6II.name, available: 2 },
      { kind: "unavailable", productId: "deleted-product" },
    ]);
  });
});
