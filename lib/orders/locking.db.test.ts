// Runs against the real database: npm run test:db
import { inArray } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { Money } from "@/lib/domain/money";

const enabled = process.env.RUN_DB_TESTS === "1";
if (enabled) process.loadEnvFile(".env.local");

const { getDb } = await import("@/lib/db/client");
const { orders, stockHolds } = await import("@/lib/db/schema");
const { changeStatus, placeOrder, settleStock } = await import("./repository");

const RUN = Date.now().toString(36);
const userId = crypto.randomUUID();
const createdOrderIds: string[] = [];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function orderFor(productId: string, readStock: () => Promise<Map<string, number>>) {
  const price = Money.fromMajor(18_500);
  return placeOrder({
    userId,
    fulfillment: "pickup",
    contactName: "Lock Test",
    contactPhone: "+639171234567",
    contactEmail: "lock-test@example.com",
    subtotal: price,
    discount: Money.zero(),
    fulfillmentFee: Money.zero(),
    total: price,
    paymentMethodId: "test",
    lines: [{ productId, name: "Test AE-1", slug: "test", condition: "Used – Excellent", unitPrice: price, quantity: 1, lineTotal: price, unitCost: null }],
    units: new Map([[productId, 1]]),
    readStock: async () => readStock(),
  });
}

async function idOf(code: string) {
  const { eq } = await import("drizzle-orm");
  const [row] = await getDb().select({ id: orders.id }).from(orders).where(eq(orders.code, code));
  createdOrderIds.push(row.id);
  return row.id;
}

describe.runIf(enabled)("pessimistic locking (real database)", () => {
  // Real network round trips to Neon: allow more than the 5s default.
  vi.setConfig({ testTimeout: 20_000 });
  afterAll(async () => {
    const db = getDb();
    const held = await db
      .select({ orderId: stockHolds.orderId })
      .from(stockHolds)
      .where(inArray(stockHolds.productId, [`lock-a-${RUN}`, `lock-b-${RUN}`, `lock-c-${RUN}`, `lock-d-${RUN}`]));
    const ids = [...new Set([...createdOrderIds, ...held.map((h) => h.orderId)])];
    if (ids.length) await db.delete(orders).where(inArray(orders.id, ids)); // cascades to items, holds, events
  });

  it("sells a one-of-a-kind item to exactly one of ten simultaneous buyers", async () => {
    const productId = `lock-a-${RUN}`;
    const results = await Promise.all(
      Array.from({ length: 10 }, () => orderFor(productId, async () => new Map([[productId, 1]]))),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toHaveLength(9);
  });

  for (const first of ["admin lowers stock first", "checkout locks first"] as const) {
    it(`never sells a paid item twice while stock is being lowered (${first})`, async () => {
      const productId = first === "admin lowers stock first" ? `lock-b-${RUN}` : `lock-c-${RUN}`;
      const sanityStock = new Map([[productId, 1]]); // stands in for Sanity's count

      // Alice orders and pays.
      const alice = await orderFor(productId, async () => new Map(sanityStock));
      if (!alice.ok) throw new Error("setup failed");
      const aliceId = await idOf(alice.code);
      await changeStatus(aliceId, "payment_review", userId, "test");
      await changeStatus(aliceId, "paid", userId, "test");

      // The admin lowers stock in "Sanity" slowly, while Bob checks out.
      const lowerSlowly = async (units: { productId: string; quantity: number }[]) => {
        await sleep(400);
        for (const u of units) sanityStock.set(u.productId, sanityStock.get(u.productId)! - u.quantity);
      };
      const settle = () => settleStock(aliceId, userId, lowerSlowly);
      // Like a real Sanity request: the count is read, then the response takes a while to arrive.
      const bob = () =>
        orderFor(productId, async () => {
          const snapshot = new Map(sanityStock);
          await sleep(500);
          return snapshot;
        });

      const [settled, bobResult] =
        first === "admin lowers stock first"
          ? await Promise.all([settle(), sleep(100).then(bob)])
          : await Promise.all([sleep(100).then(settle), bob()]);

      expect(settled).toBe(true);
      expect(sanityStock.get(productId)).toBe(0);
      expect(bobResult.ok).toBe(false);
    });
  }

  it("lowers stock only once, even if confirmed twice at the same time", async () => {
    const productId = `lock-d-${RUN}`;
    const placed = await orderFor(productId, async () => new Map([[productId, 1]]));
    if (!placed.ok) throw new Error("setup failed");
    const order = { id: await idOf(placed.code) };
    await changeStatus(order.id, "payment_review", userId, "test");
    await changeStatus(order.id, "paid", userId, "test");

    let lowered = 0;
    const lower = async () => {
      await sleep(200);
      lowered++;
    };
    const results = await Promise.all([settleStock(order.id, userId, lower), settleStock(order.id, userId, lower)]);
    expect(results.sort()).toEqual([false, true]);
    expect(lowered).toBe(1);
  });
});
