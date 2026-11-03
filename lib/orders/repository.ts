import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  orderEvents,
  orderItems,
  orders,
  paymentReceipts,
  stockHolds,
  type ShippingAddress,
} from "@/lib/db/schema";
import type { FulfillmentMethod } from "@/lib/domain/fulfillment";
import { DEFAULT_CURRENCY, Money } from "@/lib/domain/money";
import {
  canTransition,
  effectiveStatus,
  generateOrderCode,
  paymentDeadline,
  uniquePayableAmount,
  type StoredStatus,
} from "@/lib/domain/order";
import type { ReceiptCheck } from "@/lib/domain/receipt-check";
import { findShortages, type Shortage } from "@/lib/domain/stock";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Orders whose units still count against stock. Mirrors `holdsStock()` in
 * lib/domain/order.ts, plus paid orders whose units haven't been subtracted
 * in Sanity yet (so nothing oversells while that's pending).
 */
const HOLDING_STOCK = sql`(
  (${orders.status} = 'awaiting_payment' and ${orders.expiresAt} > now())
  or ${orders.status} = 'payment_review'
  or (${orders.status} in ('paid', 'completed') and not ${orders.stockDeducted})
)`;

export interface NewOrderLine {
  productId: string;
  name: string;
  slug: string;
  condition: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
  /** Cost of one unit when sold, if known. */
  unitCost: Money | null;
}

export interface NewOrder {
  userId: string;
  fulfillment: FulfillmentMethod;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address?: ShippingAddress;
  subtotal: Money;
  discount: Money;
  fulfillmentFee: Money;
  /** Before the matching centavos are taken off. */
  total: Money;
  promoCode?: string;
  paymentMethodId: string;
  lines: NewOrderLine[];
  /** Units per product this order holds (kits broken into parts). */
  units: Map<string, number>;
  /**
   * Reads stock on hand from Sanity. Called *while holding the product
   * locks*, so it can't interleave with an admin lowering stock.
   */
  readStock: (productIds: string[]) => Promise<Map<string, number>>;
}

export type PlaceOrderResult = { ok: true; code: string } | { ok: false; shortages: Shortage[] };

/**
 * Pessimistic per-product lock, held until the transaction ends. Everything
 * that changes what's available (placing an order, lowering stock in Sanity)
 * takes it first, so those steps run one at a time per product.
 * Sorted order means two transactions can never deadlock on each other.
 */
async function lockProducts(tx: Tx, productIds: string[]) {
  for (const id of [...new Set(productIds)].sort()) {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
  }
}

async function heldUnits(tx: Tx, productIds: string[]) {
  const rows = await tx
    .select({ productId: stockHolds.productId, quantity: sql<number>`sum(${stockHolds.quantity})::int` })
    .from(stockHolds)
    .innerJoin(orders, eq(orders.id, stockHolds.orderId))
    .where(and(inArray(stockHolds.productId, productIds), HOLDING_STOCK))
    .groupBy(stockHolds.productId);
  return new Map(rows.map((row) => [row.productId, row.quantity]));
}

/** Amounts other waiting orders already use near this total (for unique amounts). */
async function takenAmounts(tx: Tx, total: Money) {
  const rows = await tx
    .select({ amount: orders.amountDue })
    .from(orders)
    .where(and(HOLDING_STOCK, gte(orders.amountDue, total.minor - 99), lte(orders.amountDue, total.minor)));
  return new Set(rows.map((row) => row.amount));
}

/**
 * Creates an order and holds its stock, all or nothing. A per-product lock
 * makes simultaneous checkouts for the same item wait their turn, so the
 * last one-of-a-kind camera can only be sold once.
 */
export async function placeOrder(input: NewOrder): Promise<PlaceOrderResult> {
  return getDb().transaction(async (tx) => {
    const productIds = [...input.units.keys()].sort();
    await lockProducts(tx, productIds);

    // Read stock only after locking: see `readStock`.
    const onHand = await input.readStock(productIds);
    const shortages = findShortages(input.units, onHand, await heldUnits(tx, productIds));
    if (shortages.length > 0) return { ok: false, shortages };

    const amountDue = uniquePayableAmount(input.total, await takenAmounts(tx, input.total));
    const now = new Date();

    let order: { id: string; code: string } | undefined;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      [order] = await tx
        .insert(orders)
        .values({
          code: generateOrderCode(),
          userId: input.userId,
          fulfillment: input.fulfillment,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail,
          address: input.address ?? null,
          subtotal: input.subtotal.minor,
          discount: input.discount.minor,
          fulfillmentFee: input.fulfillmentFee.minor,
          amountDue: amountDue.minor,
          promoCode: input.promoCode ?? null,
          paymentMethodId: input.paymentMethodId,
          expiresAt: paymentDeadline(now),
          createdAt: now,
        })
        .onConflictDoNothing({ target: orders.code })
        .returning({ id: orders.id, code: orders.code });
    }
    if (!order) throw new Error("Could not generate a unique order code");

    await tx.insert(orderItems).values(
      input.lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        name: line.name,
        slug: line.slug,
        condition: line.condition,
        unitPrice: line.unitPrice.minor,
        unitCost: line.unitCost?.minor ?? null,
        quantity: line.quantity,
        lineTotal: line.lineTotal.minor,
      })),
    );
    await tx
      .insert(stockHolds)
      .values(productIds.map((productId) => ({ orderId: order.id, productId, quantity: input.units.get(productId)! })));
    await tx.insert(orderEvents).values({
      orderId: order.id,
      status: "awaiting_payment",
      note: "Order placed",
      actorId: input.userId,
    });

    return { ok: true, code: order.code };
  });
}

export type OrderRow = typeof orders.$inferSelect;

/** An order as the app shows it: amounts as Money, expiry applied. */
export function toOrderView(row: OrderRow, now = new Date()) {
  const money = (minor: number) => Money.ofMinor(minor, DEFAULT_CURRENCY);
  return {
    ...row,
    status: effectiveStatus(row.status, row.expiresAt, now),
    subtotal: money(row.subtotal),
    discount: money(row.discount),
    fulfillmentFee: money(row.fulfillmentFee),
    amountDue: money(row.amountDue),
  };
}
export type OrderView = ReturnType<typeof toOrderView>;

export async function listOrdersForUser(userId: string) {
  await connection(); // statuses depend on the current time (expiry)
  const rows = await getDb().select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return rows.map((row) => toOrderView(row));
}

/** Everything about one order. Callers must check who is allowed to see it. */
export async function getOrderDetail(code: string) {
  await connection();
  const db = getDb();
  const [row] = await db.select().from(orders).where(eq(orders.code, code));
  if (!row) return null;

  const [items, receipts, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, row.id)),
    db.select().from(paymentReceipts).where(eq(paymentReceipts.orderId, row.id)).orderBy(desc(paymentReceipts.uploadedAt)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, row.id)).orderBy(orderEvents.createdAt),
  ]);
  return { order: toOrderView(row), items, receipts, events };
}
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;

/** Orders the admin needs to act on: receipts to check, then paid orders to send out. */
export async function adminQueue() {
  await connection();
  const rows = await getDb()
    .select()
    .from(orders)
    .where(inArray(orders.status, ["payment_review", "paid"]))
    .orderBy(orders.createdAt);
  const views = rows.map((row) => toOrderView(row));
  return {
    toReview: views.filter((o) => o.status === "payment_review"),
    toFulfil: views.filter((o) => o.status === "paid"),
  };
}

export class OrderStateError extends Error {}

/** Locks the order row, applies expiry, and checks the move is allowed. */
async function lockForChange(tx: Tx, orderId: string, to: StoredStatus) {
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!row) throw new OrderStateError("Order not found");
  const current = effectiveStatus(row.status, row.expiresAt, new Date());
  if (!canTransition(current, to)) {
    throw new OrderStateError(`This order is ${current.replace("_", " ")} and can't be changed that way.`);
  }
  return row;
}

/** Saves an uploaded receipt and moves the order to "checking payment". */
export async function addReceipt(orderId: string, receipt: { objectKey: string; contentType: string }, userId: string) {
  return getDb().transaction(async (tx) => {
    const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!row) throw new OrderStateError("Order not found");
    const current = effectiveStatus(row.status, row.expiresAt, new Date());
    // A customer can replace a receipt while it's still being checked.
    if (current !== "awaiting_payment" && current !== "payment_review") {
      throw new OrderStateError(
        current === "expired"
          ? "This order expired before payment, so its items were released."
          : "This order no longer accepts receipts.",
      );
    }

    const [saved] = await tx
      .insert(paymentReceipts)
      .values({ orderId, objectKey: receipt.objectKey, contentType: receipt.contentType })
      .returning({ id: paymentReceipts.id });
    await tx
      .update(orders)
      .set({ status: "payment_review", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await tx
      .insert(orderEvents)
      .values({ orderId, status: "payment_review", note: "Payment receipt uploaded", actorId: userId });
    return saved.id;
  });
}

/** Stores the OCR result. A reference already used on another order is flagged, not saved. */
export async function saveReceiptCheck(
  receiptId: string,
  result: { text: string; check: ReceiptCheck } | { failed: string },
) {
  const db = getDb();
  if ("failed" in result) {
    await db
      .update(paymentReceipts)
      .set({ ocrStatus: "failed", check: { amountMatches: false, recipientMatches: false, flags: [result.failed] } })
      .where(eq(paymentReceipts.id, receiptId));
    return;
  }

  const { text, check } = result;
  let reference = check.reference ?? null;
  const flags = [...check.flags];

  if (reference) {
    const [duplicate] = await db
      .select({ code: orders.code })
      .from(paymentReceipts)
      .innerJoin(orders, eq(orders.id, paymentReceipts.orderId))
      .where(and(eq(paymentReceipts.reference, reference), sql`${paymentReceipts.id} <> ${receiptId}`));
    if (duplicate) {
      flags.unshift(`Reference ${reference} was already used for order ${duplicate.code}`);
      reference = null;
    }
  }

  await db
    .update(paymentReceipts)
    .set({
      ocrStatus: "done",
      ocrText: text,
      reference,
      check: { amountMatches: check.amountMatches, recipientMatches: check.recipientMatches, flags },
    })
    .where(eq(paymentReceipts.id, receiptId));
}

/** Admin status change with an audit note. Locks the order row (FOR UPDATE). */
export async function changeStatus(orderId: string, to: StoredStatus, actorId: string, note: string) {
  return getDb().transaction(async (tx) => {
    const row = await lockForChange(tx, orderId, to);
    const now = new Date();
    await tx
      .update(orders)
      .set({
        status: to,
        updatedAt: now,
        ...(to === "paid" && { paidAt: now }),
        // A customer gets a fresh 24 hours if their receipt was rejected.
        ...(to === "awaiting_payment" && { expiresAt: paymentDeadline(now) }),
      })
      .where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ orderId, status: to, note, actorId });
    return row;
  });
}

export type StockUnits = { productId: string; quantity: number }[];

/**
 * Lowers stock in Sanity for a paid order, exactly once.
 *
 * - Takes the same product locks as checkout, so no checkout can read the
 *   stock count between Sanity changing and this order releasing its hold.
 * - Locks the order row (FOR UPDATE), so a double-click or two admins at
 *   once can't lower the stock twice.
 *
 * Returns false if it was already done.
 */
export async function settleStock(
  orderId: string,
  actorId: string,
  lowerStock: (units: StockUnits) => Promise<void>,
): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    const holds = await tx
      .select({ productId: stockHolds.productId, quantity: stockHolds.quantity })
      .from(stockHolds)
      .where(eq(stockHolds.orderId, orderId));
    await lockProducts(
      tx,
      holds.map((hold) => hold.productId),
    );

    const [row] = await tx
      .select({ status: orders.status, stockDeducted: orders.stockDeducted })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!row || row.stockDeducted || (row.status !== "paid" && row.status !== "completed")) return false;

    // If Sanity fails, this throws and the transaction rolls back: the order
    // keeps holding its stock, which is the safe side.
    await lowerStock(holds);
    await tx.update(orders).set({ stockDeducted: true }).where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ orderId, note: "Stock updated in Sanity", actorId });
    return true;
  });
}

export async function addOrderNote(orderId: string, note: string, actorId: string | null) {
  await getDb().insert(orderEvents).values({ orderId, note, actorId });
}
