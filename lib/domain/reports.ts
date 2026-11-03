import { DEFAULT_CURRENCY, Money } from "./money";
import type { OrderStatus } from "./order";

/** One sold line, as stored on the order. Amounts in centavos. */
export interface ReportItem {
  productId: string;
  name: string;
  /** "Cameras", "Lenses"…, looked up from the catalog ("Unknown" if deleted). */
  category: string;
  condition: string;
  quantity: number;
  lineTotal: number;
  unitCost: number | null;
}

export interface ReportOrder {
  code: string;
  status: OrderStatus;
  createdAt: Date;
  paidAt: Date | null;
  fulfillment: string;
  paymentMethod: string;
  promoCode: string | null;
  subtotal: number;
  discount: number;
  fulfillmentFee: number;
  amountDue: number;
  items: ReportItem[];
}

export interface InventoryItem {
  productId: string;
  name: string;
  category: string;
  condition: string;
  stock: number;
  /** List price per unit, centavos. */
  price: number;
  unitCost: number | null;
  listedAt: Date | null;
}

const money = (minor: number) => Money.ofMinor(Math.round(minor), DEFAULT_CURRENCY);
const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : null);
const DAY = 24 * 60 * 60 * 1000;

/** "2026-11-02" in Philippine time, for grouping sales by day. */
export function manilaDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date);
}

interface Totals {
  units: number;
  netSales: number;
  /** Net sales of lines whose cost is known (the base for margin and ROI). */
  costedSales: number;
  cogs: number;
}
const emptyTotals = (): Totals => ({ units: 0, netSales: 0, costedSales: 0, cogs: 0 });

function finish(t: Totals) {
  const profit = t.costedSales - t.cogs;
  return {
    units: t.units,
    netSales: money(t.netSales),
    cogs: money(t.cogs),
    grossProfit: money(profit),
    margin: ratio(profit, t.costedSales),
    roi: ratio(profit, t.cogs),
    /** Share of net sales with a known cost. Below 1 means profit is partial. */
    costCoverage: ratio(t.costedSales, t.netSales),
  };
}
export type Breakdown = ReturnType<typeof finish>;

function add(map: Map<string, Totals>, key: string, units: number, net: number, cost: number | null) {
  const t = map.get(key) ?? emptyTotals();
  t.units += units;
  t.netSales += net;
  if (cost !== null) {
    t.costedSales += net;
    t.cogs += cost;
  }
  map.set(key, t);
}

const sorted = (map: Map<string, Totals>) =>
  [...map]
    .map(([key, totals]) => ({ key, ...finish(totals) }))
    .sort((a, b) => b.netSales.compare(a.netSales));

/**
 * Sales report for orders paid in the period, plus the payment funnel for
 * orders placed in it. Each order's discount and delivery fee are spread
 * over its lines in proportion to their price, so product profit is net.
 */
export function salesReport(paid: ReportOrder[], placed: ReportOrder[]) {
  const overall = emptyTotals();
  const byDay = new Map<string, Totals>();
  const byProduct = new Map<string, Totals>();
  const productNames = new Map<string, string>();
  const byCategory = new Map<string, Totals>();
  const byCondition = new Map<string, Totals>();
  const byPayment = new Map<string, Totals>();
  const byFulfillment = new Map<string, Totals>();
  const promoDiscounts = new Map<string, { orders: number; discount: number }>();
  let cashCollected = 0;
  let deliveryFees = 0;
  let discounts = 0;

  for (const order of paid) {
    cashCollected += order.amountDue;
    deliveryFees += order.fulfillmentFee;
    discounts += order.discount;
    if (order.promoCode) {
      const p = promoDiscounts.get(order.promoCode) ?? { orders: 0, discount: 0 };
      p.orders++;
      p.discount += order.discount;
      promoDiscounts.set(order.promoCode, p);
    }

    // What the customer paid for the goods: total minus the delivery fee.
    const orderNet = order.amountDue - order.fulfillmentFee;
    const share = order.subtotal > 0 ? orderNet / order.subtotal : 0;
    const day = manilaDay(order.paidAt ?? order.createdAt);

    for (const item of order.items) {
      const net = item.lineTotal * share;
      const cost = item.unitCost === null ? null : item.unitCost * item.quantity;
      const used = item.condition === "New" ? "New" : "Used / vintage";
      overall.units += item.quantity;
      overall.netSales += net;
      if (cost !== null) {
        overall.costedSales += net;
        overall.cogs += cost;
      }
      add(byDay, day, item.quantity, net, cost);
      add(byProduct, item.productId, item.quantity, net, cost);
      productNames.set(item.productId, item.name);
      add(byCategory, item.category, item.quantity, net, cost);
      add(byCondition, used, item.quantity, net, cost);
      add(byPayment, order.paymentMethod, item.quantity, net, cost);
      add(byFulfillment, order.fulfillment === "pickup" ? "Store pickup" : "Delivery", item.quantity, net, cost);
    }
  }

  const count = (status: OrderStatus[]) => placed.filter((o) => status.includes(o.status)).length;
  const paidOfPlaced = count(["paid", "completed"]);
  const lost = count(["expired", "cancelled"]);

  return {
    summary: {
      orders: paid.length,
      cashCollected: money(cashCollected),
      deliveryFees: money(deliveryFees),
      discounts: money(discounts),
      averageOrder: paid.length ? money(cashCollected / paid.length) : money(0),
      ...finish(overall),
    },
    byDay: [...byDay].map(([day, t]) => ({ day, ...finish(t) })).sort((a, b) => a.day.localeCompare(b.day)),
    topProducts: sorted(byProduct).map((row) => ({ ...row, name: productNames.get(row.key) ?? row.key })),
    byCategory: sorted(byCategory),
    byCondition: sorted(byCondition),
    byPayment: sorted(byPayment),
    byFulfillment: sorted(byFulfillment),
    promos: [...promoDiscounts]
      .map(([code, p]) => ({ code, orders: p.orders, discount: money(p.discount) }))
      .sort((a, b) => b.discount.compare(a.discount)),
    funnel: {
      placed: placed.length,
      paid: paidOfPlaced,
      waiting: count(["awaiting_payment", "payment_review"]),
      expired: count(["expired"]),
      cancelled: count(["cancelled"]),
      /** Of orders that are settled either way, the share that paid. */
      paymentRate: ratio(paidOfPlaced, paidOfPlaced + lost),
    },
  };
}
export type SalesReport = ReturnType<typeof salesReport>;

/** Stock on hand right now: value at cost and at price, and what's slow to sell. */
export function inventoryReport(items: InventoryItem[], now: Date) {
  const inStock = items.filter((item) => item.stock > 0);
  const age = (item: InventoryItem) => (item.listedAt ? Math.floor((now.getTime() - item.listedAt.getTime()) / DAY) : null);

  const buckets = [
    { label: "0–30 days", max: 30 },
    { label: "31–90 days", max: 90 },
    { label: "91–180 days", max: 180 },
    { label: "Over 180 days", max: Infinity },
  ].map((bucket) => ({ label: bucket.label, max: bucket.max, units: 0, value: 0 }));

  let atCost = 0;
  let atPrice = 0;
  let units = 0;
  let missingCost = 0;
  // Stock without a listing date gets its own row instead of silently disappearing.
  const undated = { label: "Listing date unknown", max: NaN, units: 0, value: 0 };
  for (const item of inStock) {
    units += item.stock;
    atPrice += item.price * item.stock;
    if (item.unitCost === null) missingCost++;
    else atCost += item.unitCost * item.stock;
    const days = age(item);
    const bucket = days === null ? undated : buckets.find((b) => days <= b.max)!;
    bucket.units += item.stock;
    bucket.value += item.price * item.stock;
  }
  if (undated.units > 0) buckets.push(undated);

  return {
    products: inStock.length,
    units,
    valueAtCost: money(atCost),
    valueAtPrice: money(atPrice),
    /** Profit if everything in stock sold at list price (known costs only). */
    potentialProfit: money(
      inStock.filter((i) => i.unitCost !== null).reduce((sum, i) => sum + (i.price - i.unitCost!) * i.stock, 0),
    ),
    missingCost,
    aging: buckets.map(({ label, units, value }) => ({ label, units, value: money(value) })),
    slowest: inStock
      .filter((item) => age(item) !== null)
      .sort((a, b) => a.listedAt!.getTime() - b.listedAt!.getTime())
      .slice(0, 10)
      .map((item) => ({ ...item, days: age(item)!, value: money(item.price * item.stock) })),
  };
}
export type InventoryReport = ReturnType<typeof inventoryReport>;

export const REPORT_RANGES = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  "365d": { label: "Last 12 months", days: 365 },
} as const;
export type ReportRange = keyof typeof REPORT_RANGES;

export function parseRange(value: unknown): ReportRange {
  return typeof value === "string" && Object.hasOwn(REPORT_RANGES, value) ? (value as ReportRange) : "30d";
}

export function rangeStart(range: ReportRange, now: Date) {
  return new Date(now.getTime() - REPORT_RANGES[range].days * DAY);
}

export interface SeriesPoint {
  /** First day of the bucket, "2026-11-02". */
  start: string;
  label: string;
  netSales: Money;
  grossProfit: Money;
  units: number;
}

const DATE_LABEL = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });
const MONTH_LABEL = new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Daily figures → evenly spaced buckets covering the whole period: days for
 * up to a month, weeks (Monday start) up to ~4 months, months beyond.
 * Days without sales become zero bars, so gaps in sales stay visible.
 */
export function salesSeries(byDay: SalesReport["byDay"], from: Date, to: Date): SeriesPoint[] {
  const spanDays = Math.ceil((to.getTime() - from.getTime()) / DAY);
  const unit = spanDays <= 31 ? "day" : spanDays <= 120 ? "week" : "month";

  const bucketOf = (day: string) => {
    const d = new Date(`${day}T00:00:00Z`);
    if (unit === "week") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    if (unit === "month") d.setUTCDate(1);
    return d.toISOString().slice(0, 10);
  };

  const buckets = new Map<string, { net: number; profit: number; units: number }>();
  for (let t = new Date(`${manilaDay(from)}T00:00:00Z`); manilaDay(t) <= manilaDay(to); t = new Date(t.getTime() + DAY)) {
    buckets.set(bucketOf(t.toISOString().slice(0, 10)), { net: 0, profit: 0, units: 0 });
  }
  for (const day of byDay) {
    const bucket = buckets.get(bucketOf(day.day));
    if (!bucket) continue;
    bucket.net += day.netSales.minor;
    bucket.profit += day.grossProfit.minor;
    bucket.units += day.units;
  }

  return [...buckets].map(([start, b]) => {
    const date = new Date(`${start}T00:00:00Z`);
    return {
      start,
      label: unit === "month" ? MONTH_LABEL.format(date) : `${unit === "week" ? "Week of " : ""}${DATE_LABEL.format(date)}`,
      netSales: money(b.net),
      grossProfit: money(b.profit),
      units: b.units,
    };
  });
}
