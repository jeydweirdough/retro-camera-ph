import { DEFAULT_CURRENCY, Money } from "./money";

/** How long an unpaid order holds its items before the stock is released. */
export const PAYMENT_WINDOW_HOURS = 24;

/** Statuses stored in the database. */
export const STORED_STATUSES = [
  "awaiting_payment",
  "payment_review",
  "paid",
  "completed",
  "cancelled",
] as const;
export type StoredStatus = (typeof STORED_STATUSES)[number];

/** What shoppers and admins see. "expired" is computed, never stored. */
export type OrderStatus = StoredStatus | "expired";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Waiting for payment",
  payment_review: "Checking your payment",
  paid: "Paid, preparing your order",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired (not paid in time)",
};

/**
 * An unpaid order expires once its payment window passes. Computing this
 * when reading (instead of with a scheduled job) means nothing can forget to
 * run, and the stock frees up the moment the window ends.
 */
export function effectiveStatus(status: StoredStatus, expiresAt: Date, now: Date): OrderStatus {
  return status === "awaiting_payment" && now > expiresAt ? "expired" : status;
}

/** Whether an order is still holding stock. */
export function holdsStock(status: OrderStatus) {
  return status === "awaiting_payment" || status === "payment_review";
}

/** Who may move an order from one status to another. */
const TRANSITIONS: Record<OrderStatus, readonly StoredStatus[]> = {
  awaiting_payment: ["payment_review", "cancelled"],
  payment_review: ["paid", "awaiting_payment", "cancelled"],
  paid: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: [],
};

export function canTransition(from: OrderStatus, to: StoredStatus) {
  return TRANSITIONS[from].includes(to);
}

export function paymentDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000);
}

// No 0/O or 1/I, so codes are easy to read out loud or type from a receipt.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. "RC-7K3F9Q". Random, so order numbers don't reveal sales volume. */
export function generateOrderCode(random: (n: number) => Uint8Array = randomBytes) {
  const bytes = random(6);
  return `RC-${[...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")}`;
}

function randomBytes(n: number) {
  return crypto.getRandomValues(new Uint8Array(n));
}

/**
 * Takes 1–99 centavos off the total so each waiting order has a unique
 * amount (e.g. ₱18,499.63). The admin can then match a bank or e-wallet
 * payment to its order by amount alone. The store absorbs the centavos.
 *
 * `taken` holds the totals (in centavos) of other orders still waiting.
 */
export function uniquePayableAmount(
  total: Money,
  taken: ReadonlySet<number>,
  random: () => number = Math.random,
): Money {
  if (total.minor < 100) return total; // too small to adjust

  const free: number[] = [];
  for (let centavos = 1; centavos <= 99; centavos++) {
    if (!taken.has(total.minor - centavos)) free.push(centavos);
  }
  if (free.length === 0) return total; // 99 identical waiting orders: give up gracefully

  const centavos = free[Math.floor(random() * free.length)];
  return Money.ofMinor(total.minor - centavos, DEFAULT_CURRENCY);
}
