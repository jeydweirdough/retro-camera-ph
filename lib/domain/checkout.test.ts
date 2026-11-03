import { describe, expect, it } from "vitest";
import { sampleProducts, sdCard128, sony50f18, sonyA7IV, sonyStarterKit } from "@/lib/data/sample-repository";
import { Catalog } from "./catalog";
import { Delivery, fulfillmentOptions, Pickup } from "./fulfillment";
import { Money } from "./money";
import {
  canTransition,
  effectiveStatus,
  generateOrderCode,
  holdsStock,
  paymentDeadline,
  uniquePayableAmount,
} from "./order";
import { checkReceipt, parseReceipt, receiptShowsName } from "./receipt-check";
import { findShortages, unitsNeeded } from "./stock";

const php = (pesos: number) => Money.fromMajor(pesos);

describe("fulfillment", () => {
  const settings = {
    deliveryFee: 150_00,
    freeDeliveryMinimum: 5_000_00,
    pickup: { address: "Quezon City", hours: "Mon–Sat 10am–6pm" },
  };

  it("offers pickup first when the store has a pickup address", () => {
    const [pickup, delivery] = fulfillmentOptions(settings);
    expect(pickup).toBeInstanceOf(Pickup);
    expect(delivery).toBeInstanceOf(Delivery);
    expect(fulfillmentOptions({ deliveryFee: 150_00 }).map((f) => f.method)).toEqual(["delivery"]);
  });

  it("charges each method's own fee (polymorphism)", () => {
    const [pickup, delivery] = fulfillmentOptions(settings);
    expect(pickup.fee(php(1000)).isZero()).toBe(true);
    expect(delivery.fee(php(1000)).format()).toBe("₱150.00");
    expect(delivery.fee(php(5000)).isZero()).toBe(true); // free at the minimum
  });

  it("only delivery needs an address", () => {
    expect(fulfillmentOptions(settings).map((f) => f.needsAddress)).toEqual([false, true]);
  });
});

describe("order status", () => {
  const created = new Date("2026-11-02T00:00:00Z");
  const deadline = paymentDeadline(created);

  it("expires unpaid orders after 24 hours, without a scheduled job", () => {
    expect(deadline.toISOString()).toBe("2026-11-03T00:00:00.000Z");
    expect(effectiveStatus("awaiting_payment", deadline, new Date("2026-11-02T23:00:00Z"))).toBe(
      "awaiting_payment",
    );
    expect(effectiveStatus("awaiting_payment", deadline, new Date("2026-11-03T00:00:01Z"))).toBe("expired");
  });

  it("never expires an order whose receipt was uploaded", () => {
    expect(effectiveStatus("payment_review", deadline, new Date("2027-01-01"))).toBe("payment_review");
  });

  it("holds stock only while waiting for or checking payment", () => {
    expect(["awaiting_payment", "payment_review", "paid", "expired"].map((s) => holdsStock(s as never))).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it("allows only sensible status changes", () => {
    expect(canTransition("payment_review", "paid")).toBe(true);
    expect(canTransition("awaiting_payment", "paid")).toBe(false); // must upload a receipt first
    expect(canTransition("expired", "payment_review")).toBe(false);
    expect(canTransition("completed", "cancelled")).toBe(false);
  });
});

describe("generateOrderCode", () => {
  it("makes short codes without look-alike characters", () => {
    for (let i = 0; i < 200; i++) expect(generateOrderCode()).toMatch(/^RC-[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("uniquePayableAmount", () => {
  it("takes 1–99 centavos off so waiting orders don't share an amount", () => {
    const total = php(18500);
    const amount = uniquePayableAmount(total, new Set());
    expect(total.minor - amount.minor).toBeGreaterThanOrEqual(1);
    expect(total.minor - amount.minor).toBeLessThanOrEqual(99);
  });

  it("skips amounts other waiting orders already use", () => {
    const total = php(100);
    const taken = new Set(Array.from({ length: 98 }, (_, i) => total.minor - (i + 1))); // 1..98 taken
    expect(uniquePayableAmount(total, taken).minor).toBe(total.minor - 99);
  });

  it("leaves tiny totals alone", () => {
    expect(uniquePayableAmount(Money.ofMinor(50), new Set()).minor).toBe(50);
  });
});

const GCASH_RECEIPT = `
GCash
Sent via GCash
JU*N DE** C.
+63 917 *** 1234
Amount
18,499.63
Total Amount Sent
₱18,499.63
Ref No. 1023 456 789012
Nov 2, 2026 1:15 PM
`;

describe("receipt check", () => {
  it("reads amounts and the reference number", () => {
    const parsed = parseReceipt(GCASH_RECEIPT);
    expect(parsed.amounts.map((a) => a.format())).toContain("₱18,499.63");
    expect(parsed.reference).toBe("1023456789012");
  });

  it("matches masked and abbreviated recipient names", () => {
    // GCash shows "Juan Dela Cruz" as "JU*N DE** C."
    expect(receiptShowsName(GCASH_RECEIPT, "Juan Dela Cruz")).toBe(true);
    expect(receiptShowsName(GCASH_RECEIPT, "Maria Dela Cruz")).toBe(false); // visible letters differ
    expect(receiptShowsName("Sent to JUAN DELA CRUZ", "Juan Dela Cruz")).toBe(true);
    expect(receiptShowsName("Sent to MARIA SANTOS", "Juan Dela Cruz")).toBe(false);
    // OCR often merges "**" into "*" (seen on a real test run).
    expect(receiptShowsName("SA*LE AC****T", "Sample Account")).toBe(true);
    expect(receiptShowsName("SA*LE AC*T", "Simple Account")).toBe(false);
    expect(receiptShowsName("**** ****", "Juan Cruz")).toBe(false); // nothing readable
  });

  it("passes a matching receipt with no flags", () => {
    const result = checkReceipt(parseReceipt(GCASH_RECEIPT), {
      amount: Money.ofMinor(1_849_963),
      accountName: "Juan Dela C",
    });
    expect(result).toMatchObject({ amountMatches: true, recipientMatches: true, flags: [] });
  });

  it("flags a wrong amount and recipient in plain language", () => {
    const result = checkReceipt(parseReceipt(GCASH_RECEIPT), {
      amount: Money.ofMinor(1_850_000),
      accountName: "Retro Camera PH",
    });
    expect(result.flags).toEqual([
      "Expected ₱18,500.00; amounts read: ₱18,499.63, ₱18,499.63",
      'Recipient "Retro Camera PH" not found on the receipt',
    ]);
  });
});

describe("stock units", () => {
  const catalog = Catalog.fromDTOs(sampleProducts);
  const line = (slug: string, quantity: number) => {
    const product = catalog.find(slug)!;
    return { product, quantity, unitPrice: product.price(), total: product.price().multiply(quantity) };
  };

  it("breaks kits into their parts and adds up shared products", () => {
    // Kit = 1 A7 IV + 1 50mm + 2 SD cards; plus 1 more SD card bought separately.
    const units = unitsNeeded([line(sonyStarterKit.slug, 1), line(sdCard128.slug, 1)]);
    expect(Object.fromEntries(units)).toEqual({
      [sonyA7IV.id]: 1,
      [sony50f18.id]: 1,
      [sdCard128.id]: 3,
    });
  });

  it("subtracts other orders' holds from stock on hand", () => {
    const needed = new Map([["ae1", 1], ["card", 2]]);
    const onHand = new Map([["ae1", 1], ["card", 50]]);
    const held = new Map([["ae1", 1]]); // someone else is paying for the only AE-1
    expect(findShortages(needed, onHand, held)).toEqual([{ productId: "ae1", needed: 1, available: 0 }]);
  });
});
