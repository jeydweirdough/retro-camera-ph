import { describe, expect, it } from "vitest";
import { Cart, MAX_LINES, MAX_QUANTITY_PER_LINE } from "./cart";

describe("Cart", () => {
  it("adds, merges and counts items", () => {
    const cart = new Cart();
    cart.add("a");
    cart.add("a", 2);
    cart.add("b");
    expect(cart.quantityOf("a")).toBe(3);
    expect(cart.itemCount).toBe(4);
  });

  it("caps quantity per line", () => {
    const cart = new Cart();
    cart.add("a", MAX_QUANTITY_PER_LINE + 5);
    expect(cart.quantityOf("a")).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("removes a line when quantity is set to 0", () => {
    const cart = new Cart();
    cart.add("a");
    cart.setQuantity("a", 0);
    expect(cart.isEmpty).toBe(true);
  });

  it("rejects invalid quantities", () => {
    const cart = new Cart();
    expect(() => cart.add("a", 0)).toThrow(RangeError);
    expect(() => cart.add("a", 1.5)).toThrow(RangeError);
    expect(() => cart.setQuantity("a", -1)).toThrow(RangeError);
  });

  it("normalizes promo codes", () => {
    const cart = new Cart();
    cart.applyCode("  welcome500 ");
    expect(cart.promoCode).toBe("WELCOME500");
    cart.applyCode("   ");
    expect(cart.promoCode).toBeUndefined();
  });

  it("round-trips through JSON", () => {
    const cart = new Cart();
    cart.add("a", 2);
    cart.applyCode("LENS10");
    expect(Cart.fromJSON(JSON.parse(JSON.stringify(cart))).toJSON()).toEqual(cart.toJSON());
  });

  it("survives tampered cookie data", () => {
    const cart = Cart.fromJSON({
      lines: [
        { productId: "a", quantity: 999 },
        { productId: "b", quantity: -3 },
        { productId: 42, quantity: 1 },
        null,
        ...Array.from({ length: MAX_LINES + 10 }, (_, i) => ({ productId: `x${i}`, quantity: 1 })),
      ],
      promoCode: { evil: true },
    });
    expect(cart.quantityOf("a")).toBe(MAX_QUANTITY_PER_LINE);
    expect(cart.quantityOf("b")).toBe(0);
    expect(cart.entries().length).toBeLessThanOrEqual(MAX_LINES);
    expect(cart.promoCode).toBeUndefined();
    expect(Cart.fromJSON("garbage").isEmpty).toBe(true);
  });
});
