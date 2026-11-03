import { and, gte, inArray, lt } from "drizzle-orm";
import { connection } from "next/server";
import { getCostMap } from "@/lib/costs/repository";
import { getDb } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import { loadCatalog } from "@/lib/data/catalog";
import { getPaymentMethods } from "@/lib/data/checkout-content";
import { effectiveStatus } from "@/lib/domain/order";
import {
  inventoryReport,
  rangeStart,
  salesReport,
  salesSeries,
  type ReportOrder,
  type ReportRange,
} from "@/lib/domain/reports";

/** Everything the reports page shows, for one period. Admin only (callers check). */
export async function loadReports(range: ReportRange) {
  await connection(); // "now" and live data: never prerendered
  const now = new Date();
  const from = rangeStart(range, now);
  const db = getDb();

  const [paidRows, placedRows, catalog, methods] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(and(inArray(orders.status, ["paid", "completed"]), gte(orders.paidAt, from), lt(orders.paidAt, now))),
    db.select().from(orders).where(and(gte(orders.createdAt, from), lt(orders.createdAt, now))),
    loadCatalog(),
    getPaymentMethods(),
  ]);

  const orderIds = [...new Set([...paidRows, ...placedRows].map((o) => o.id))];
  const items = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];
  const itemsByOrder = Map.groupBy(items, (item) => item.orderId);

  const methodName = new Map(methods.map((m) => [m.id, m.name]));
  const toReport = (row: (typeof paidRows)[number]): ReportOrder => ({
    code: row.code,
    status: effectiveStatus(row.status, row.expiresAt, now),
    createdAt: row.createdAt,
    paidAt: row.paidAt,
    fulfillment: row.fulfillment,
    paymentMethod: methodName.get(row.paymentMethodId) ?? "Other / removed method",
    promoCode: row.promoCode,
    subtotal: row.subtotal,
    discount: row.discount,
    fulfillmentFee: row.fulfillmentFee,
    amountDue: row.amountDue,
    items: (itemsByOrder.get(row.id) ?? []).map((item) => ({
      productId: item.productId,
      name: item.name,
      category: catalog.findById(item.productId)?.category.label ?? "Unknown (deleted product)",
      condition: item.condition,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      unitCost: item.unitCost,
    })),
  });

  const sales = salesReport(paidRows.map(toReport), placedRows.map(toReport));

  // Inventory: products sold on their own (a kit's stock is its parts' stock).
  const standalone = catalog.products.filter((p) => p.type !== "bundle");
  const costs = await getCostMap(standalone.map((p) => p.id));
  const inventory = inventoryReport(
    standalone.map((p) => ({
      productId: p.id,
      name: p.name,
      category: p.category.label,
      condition: p.conditionLabel,
      stock: p.stock,
      price: p.price().minor,
      unitCost: costs.get(p.id) ?? null,
      listedAt: p.listedAt ? new Date(p.listedAt) : null,
    })),
    now,
  );

  return { from, to: now, sales, series: salesSeries(sales.byDay, from, now), inventory };
}
export type Reports = Awaited<ReturnType<typeof loadReports>>;
