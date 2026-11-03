import { describe, expect, it } from "vitest";
import { sampleProducts, sonyStarterKit } from "@/lib/data/sample-repository";
import { Catalog } from "./catalog";
import { unitCostOf } from "./costs";
import { Money } from "./money";
import { inventoryReport, manilaDay, salesReport, salesSeries, type ReportOrder } from "./reports";

const base: Omit<ReportOrder, "code" | "items" | "subtotal" | "discount" | "fulfillmentFee" | "amountDue"> = {
  status: "paid",
  createdAt: new Date("2026-11-01T02:00:00Z"),
  paidAt: new Date("2026-11-01T03:00:00Z"),
  fulfillment: "delivery",
  paymentMethod: "GCash",
  promoCode: null,
};

// Camera sold for ₱20,000 (cost ₱15,000) + lens ₱5,000 (cost unknown);
// ₱2,500 discount, ₱150 delivery, 50 centavos matching adjustment.
const orderA: ReportOrder = {
  ...base,
  code: "RC-A",
  promoCode: "WELCOME",
  subtotal: 25_000_00,
  discount: 2_500_00,
  fulfillmentFee: 150_00,
  amountDue: 22_649_50,
  items: [
    { productId: "cam", name: "AE-1", category: "Cameras", condition: "Used – Excellent", quantity: 1, lineTotal: 20_000_00, unitCost: 15_000_00 },
    { productId: "lens", name: "FD 50", category: "Lenses", condition: "Used – Good", quantity: 1, lineTotal: 5_000_00, unitCost: null },
  ],
};

// Two SD cards at ₱1,000 (cost ₱600 each), pickup, no discount.
const orderB: ReportOrder = {
  ...base,
  code: "RC-B",
  paidAt: new Date("2026-11-02T17:00:00Z"), // Nov 3, 1am in Manila
  fulfillment: "pickup",
  paymentMethod: "Maya",
  subtotal: 2_000_00,
  discount: 0,
  fulfillmentFee: 0,
  amountDue: 2_000_00,
  items: [{ productId: "card", name: "SD card", category: "Accessories", condition: "New", quantity: 2, lineTotal: 2_000_00, unitCost: 600_00 }],
};

describe("salesReport", () => {
  const report = salesReport([orderA, orderB], [
    orderA,
    orderB,
    { ...orderB, code: "RC-C", status: "expired", paidAt: null },
    { ...orderB, code: "RC-D", status: "awaiting_payment", paidAt: null },
  ]);

  it("separates cash, delivery fees and discounts", () => {
    const s = report.summary;
    expect(s.orders).toBe(2);
    expect(s.cashCollected.format()).toBe("₱24,649.50");
    expect(s.deliveryFees.format()).toBe("₱150.00");
    expect(s.discounts.format()).toBe("₱2,500.00");
    expect(s.netSales.format()).toBe("₱24,499.50"); // cash minus delivery
    expect(s.averageOrder.format()).toBe("₱12,324.75");
  });

  it("computes profit, margin and ROI only where cost is known, and says how much that covers", () => {
    // Camera's net share: 20,000 × (22,499.50 / 25,000) = 17,999.60; cards: 2,000.
    const s = report.summary;
    expect(s.cogs.format()).toBe("₱16,200.00");
    expect(s.grossProfit.format()).toBe("₱3,799.60");
    expect(s.margin).toBeCloseTo(3_799.6 / 19_999.6, 6);
    expect(s.roi).toBeCloseTo(3_799.6 / 16_200, 6);
    expect(s.costCoverage).toBeCloseTo(19_999.6 / 24_499.5, 6);
  });

  it("breaks sales down by product, category, condition, payment and day (Manila time)", () => {
    expect(report.topProducts.map((p) => p.name)).toEqual(["AE-1", "FD 50", "SD card"]);
    expect(report.topProducts[1].roi).toBeNull(); // lens cost unknown
    expect(report.byCondition.map((c) => [c.key, c.units])).toEqual([
      ["Used / vintage", 2],
      ["New", 2],
    ]);
    expect(report.byPayment.map((p) => p.key)).toEqual(["GCash", "Maya"]);
    expect(report.byDay.map((d) => d.day)).toEqual(["2026-11-01", "2026-11-03"]);
    expect(report.promos).toEqual([{ code: "WELCOME", orders: 1, discount: expect.anything() }]);
  });

  it("counts the payment funnel for orders placed in the period", () => {
    expect(report.funnel).toEqual({ placed: 4, paid: 2, waiting: 1, expired: 1, cancelled: 0, paymentRate: 2 / 3 });
  });

  it("handles an empty period without dividing by zero", () => {
    const empty = salesReport([], []);
    expect(empty.summary.margin).toBeNull();
    expect(empty.summary.roi).toBeNull();
    expect(empty.summary.averageOrder.isZero()).toBe(true);
    expect(empty.funnel.paymentRate).toBeNull();
  });
});

describe("inventoryReport", () => {
  const now = new Date("2026-11-02T00:00:00Z");
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const report = inventoryReport(
    [
      { productId: "a", name: "AE-1", category: "Cameras", condition: "Used – Excellent", stock: 1, price: 18_500_00, unitCost: 12_000_00, listedAt: daysAgo(200) },
      { productId: "b", name: "SD", category: "Accessories", condition: "New", stock: 10, price: 1_000_00, unitCost: null, listedAt: daysAgo(5) },
      { productId: "c", name: "Sold out", category: "Lenses", condition: "New", stock: 0, price: 5_000_00, unitCost: 1, listedAt: daysAgo(1) },
    ],
    now,
  );

  it("values stock at cost and at price, flagging missing costs", () => {
    expect(report.products).toBe(2);
    expect(report.units).toBe(11);
    expect(report.valueAtCost.format()).toBe("₱12,000.00");
    expect(report.valueAtPrice.format()).toBe("₱28,500.00");
    expect(report.potentialProfit.format()).toBe("₱6,500.00");
    expect(report.missingCost).toBe(1);
  });

  it("shows how long stock has been sitting, slowest first", () => {
    expect(report.aging.map((b) => b.units)).toEqual([10, 0, 0, 1]);
    expect(report.slowest.map((s) => [s.name, s.days])).toEqual([
      ["AE-1", 200],
      ["SD", 5],
    ]);
  });
});

describe("unitCostOf", () => {
  const catalog = Catalog.fromDTOs(sampleProducts);
  it("costs a kit as the sum of its parts, or null if any part is unknown", () => {
    const kit = catalog.find(sonyStarterKit.slug)!;
    const costs = new Map([
      ["cam-sony-a7iv", 110_000_00],
      ["lens-sony-fe-50-18", 10_000_00],
      ["acc-sandisk-128", 1_000_00],
    ]);
    expect(unitCostOf(kit, costs)?.format()).toBe("₱122,000.00"); // 110k + 10k + 2 × 1k
    costs.delete("acc-sandisk-128");
    expect(unitCostOf(kit, costs)).toBeNull();
  });

  it("formats Manila days across midnight UTC", () => {
    expect(manilaDay(new Date("2026-11-02T16:30:00Z"))).toBe("2026-11-03");
  });
});

describe("salesSeries", () => {
  const day = (d: string, net: number) => ({ day: d, ...salesReport([], []).summary, netSales: Money.ofMinor(net), grossProfit: Money.ofMinor(0), units: 1 });

  it("fills days without sales with zero", () => {
    const series = salesSeries([day("2026-11-02", 100_00)], new Date("2026-10-31T00:00:00Z"), new Date("2026-11-03T00:00:00Z"));
    expect(series.map((p) => [p.start, p.netSales.minor])).toEqual([
      ["2026-10-31", 0],
      ["2026-11-01", 0],
      ["2026-11-02", 100_00],
      ["2026-11-03", 0],
    ]);
  });

  it("groups long periods by week (Monday) and month", () => {
    const weekly = salesSeries([day("2026-11-04", 5), day("2026-11-08", 7)], new Date("2026-09-01T00:00:00Z"), new Date("2026-11-10T00:00:00Z"));
    expect(weekly.find((p) => p.start === "2026-11-02")?.netSales.minor).toBe(12); // Wed + Sun of the same week
    expect(weekly[weekly.length - 1].label).toBe("Week of Nov 9");

    const monthly = salesSeries([day("2026-11-04", 5)], new Date("2025-11-10T00:00:00Z"), new Date("2026-11-10T00:00:00Z"));
    expect(monthly).toHaveLength(13);
    expect(monthly[monthly.length - 1]).toMatchObject({ start: "2026-11-01", label: "Nov 2026" });
  });
});

describe("inventoryReport: undated stock", () => {
  it("counts stock without a listing date in its own row", () => {
    const report = inventoryReport(
      [{ productId: "x", name: "X", category: "Cameras", condition: "New", stock: 3, price: 100_00, unitCost: null, listedAt: null }],
      new Date(),
    );
    expect(report.aging.at(-1)).toMatchObject({ label: "Listing date unknown", units: 3 });
    expect(report.aging.reduce((sum, b) => sum + b.units, 0)).toBe(report.units);
  });
});
