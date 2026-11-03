import { describe, expect, it } from "vitest";
import { Money } from "./money";
import { PriceList } from "./price-list";

describe("Money", () => {
  it("defaults to PHP and formats for people and machines", () => {
    const price = Money.ofMinor(49_999_37);
    expect(price.currency).toBe("PHP");
    expect(price.format()).toBe("₱49,999.37");
    expect(price.toDecimalString()).toBe("49999.37");
  });

  it("adds without floating-point errors", () => {
    // 0.1 + 0.2 !== 0.3 with floats; integer centavos are exact.
    expect(Money.ofMinor(10).add(Money.ofMinor(20)).equals(Money.ofMinor(30))).toBe(true);
  });

  it("is immutable", () => {
    const a = Money.ofMinor(100);
    a.add(Money.ofMinor(50));
    expect(a.minor).toBe(100);
  });

  it("rounds percentages to whole centavos", () => {
    expect(Money.ofMinor(999).percentOff(10).minor).toBe(899);
  });

  it("sums a list, and zero for an empty list", () => {
    expect(Money.sum([Money.ofMinor(100), Money.ofMinor(250)]).minor).toBe(350);
    expect(Money.sum([], "USD").equals(Money.zero("USD"))).toBe(true);
  });

  it("refuses to mix currencies", () => {
    expect(() => Money.ofMinor(1, "PHP").add(Money.ofMinor(1, "USD"))).toThrow(TypeError);
  });

  it("refuses fractional minor units", () => {
    expect(() => Money.ofMinor(1.5)).toThrow(RangeError);
  });
});

describe("PriceList", () => {
  it("looks up a currency and falls back to PHP when missing", () => {
    const prices = PriceList.fromMap({ PHP: 1_000_00 });
    expect(prices.has("USD")).toBe(false);
    expect(prices.in("USD").currency).toBe("PHP");
  });

  it("requires a PHP price", () => {
    expect(() => PriceList.fromMoney([Money.ofMinor(100, "USD")])).toThrow(TypeError);
  });

  it("round-trips to plain JSON", () => {
    const map = { PHP: 500_00, USD: 9_00 };
    expect(PriceList.fromMap(map).toJSON()).toEqual(map);
  });
});
