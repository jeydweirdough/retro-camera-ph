import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { STORED_STATUSES } from "@/lib/domain/order";

// Money columns are integers in centavos, like the Money class.
// Users live in Neon Auth's own `neon_auth.user` table; we store their id.

export const orderStatus = pgEnum("order_status", STORED_STATUSES);
export const fulfillmentMethod = pgEnum("fulfillment_method", ["pickup", "delivery"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    userId: uuid("user_id").notNull(),
    status: orderStatus("status").notNull().default("awaiting_payment"),

    fulfillment: fulfillmentMethod("fulfillment").notNull(),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email").notNull(),
    /** Delivery address; null for pickup. */
    address: jsonb("address").$type<ShippingAddress>(),

    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull(),
    fulfillmentFee: integer("fulfillment_fee").notNull(),
    /** What the customer must pay, including the matching centavos taken off. */
    amountDue: integer("amount_due").notNull(),
    promoCode: text("promo_code"),

    /** Sanity id of the QR payment method the customer chose. */
    paymentMethodId: text("payment_method_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /** True once the sold units were subtracted from the stock count in Sanity. */
    stockDeducted: boolean("stock_deducted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId, t.createdAt),
    index("orders_status_idx").on(t.status),
    check("orders_amounts_positive", sql`${t.amountDue} >= 0 AND ${t.subtotal} >= 0`),
  ],
);

/** What was bought, frozen at order time (names and prices can change later). */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    condition: text("condition").notNull(),
    unitPrice: integer("unit_price").notNull(),
    /** What one unit cost the store, frozen at order time (null = unknown). For profit reports. */
    unitCost: integer("unit_cost"),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), check("order_items_qty", sql`${t.quantity} > 0`)],
);

/**
 * Units each order holds per product. A kit holds its parts, so a kit and
 * its camera sold separately can never oversell the same body.
 */
export const stockHolds = pgTable(
  "stock_holds",
  {
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("stock_holds_product_idx").on(t.productId)],
);

export const paymentReceipts = pgTable(
  "payment_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Object key in the private receipts bucket. */
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    /** Read by OCR. Unique, so one receipt can't pay for two orders. */
    reference: text("reference"),
    ocrStatus: text("ocr_status").notNull().default("pending"), // pending | done | failed
    ocrText: text("ocr_text"),
    check: jsonb("check").$type<{ amountMatches: boolean; recipientMatches: boolean; flags: string[] }>(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payment_receipts_order_idx").on(t.orderId),
    uniqueIndex("payment_receipts_reference_key").on(t.reference),
  ],
);

/** Audit trail: who changed an order and why. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatus("status"),
    note: text("note").notNull(),
    actorId: uuid("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)],
);

export interface ShippingAddress {
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

/**
 * What the store paid per unit, in centavos. Kept here, not in Sanity,
 * because Sanity content is publicly readable and costs must stay private.
 */
export const productCosts = pgTable("product_costs", {
  productId: text("product_id").primaryKey(),
  unitCost: integer("unit_cost").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
