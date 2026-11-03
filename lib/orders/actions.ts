"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { saveCart } from "@/lib/cart/cart-cookie";
import { loadQuote } from "@/lib/cart/load-quote";
import { getCostMap } from "@/lib/costs/repository";
import { getFreshStock, loadCatalog, PRODUCTS_TAG } from "@/lib/data/catalog";
import { getPaymentMethods, getStoreSettings } from "@/lib/data/checkout-content";
import { canWriteStock, deductStock } from "@/lib/data/sanity-stock";
import { Cart } from "@/lib/domain/cart";
import { unitCostOf } from "@/lib/domain/costs";
import { fulfillmentOptions } from "@/lib/domain/fulfillment";
import type { StoredStatus } from "@/lib/domain/order";
import { checkReceipt, parseReceipt } from "@/lib/domain/receipt-check";
import { unitsNeeded } from "@/lib/domain/stock";
import { TesseractReceiptReader } from "@/lib/ocr/receipt-reader";
import { detectImageType, MAX_RECEIPT_BYTES, putReceipt } from "@/lib/storage/receipts";
import {
  normalizePhMobile,
  readCheckoutForm,
  toAddress,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutValues,
} from "./checkout-form";
import {
  addOrderNote,
  addReceipt,
  changeStatus,
  getOrderDetail,
  OrderStateError,
  placeOrder,
  saveReceiptCheck,
  settleStock,
} from "./repository";

export interface CheckoutResult {
  message: string;
  errors?: CheckoutErrors;
  /** Sent back so the form keeps what the customer typed. */
  values?: CheckoutValues;
}

export async function placeOrderAction(_previous: CheckoutResult | null, formData: FormData): Promise<CheckoutResult> {
  const user = await requireUser("/checkout");
  const values = readCheckoutForm(formData);

  const [{ cart, quote }, settings, paymentMethods] = await Promise.all([
    loadQuote(),
    getStoreSettings(),
    getPaymentMethods(),
  ]);

  if (!settings) return { message: "Checkout isn't open yet. Please try again later.", values };
  if (quote.lines.length === 0) return { message: "Your cart is empty.", values };
  if (quote.issues.length > 0) {
    return { message: "Some items in your cart changed. Please review your cart and try again.", values };
  }

  const fulfillment = fulfillmentOptions(settings).find((option) => option.method === values.fulfillment);
  if (!fulfillment) return { message: "Choose pickup or delivery.", values };

  const errors = validateCheckout(values, fulfillment.needsAddress);
  const paymentMethod = paymentMethods.find((method) => method.id === values.paymentMethodId);
  if (!paymentMethod && values.paymentMethodId) errors.paymentMethodId = "That payment method isn't available.";
  if (Object.keys(errors).length > 0 || !paymentMethod) {
    return { message: "Please fix the highlighted fields.", errors, values };
  }

  // The server prices everything again here; nothing from the browser is trusted.
  const fee = fulfillment.fee(quote.total);
  const units = unitsNeeded(quote.lines);
  // Frozen on each line so later cost edits don't rewrite past profit.
  const costs = await getCostMap([...units.keys()]);

  const result = await placeOrder({
    userId: user.id,
    fulfillment: fulfillment.method,
    contactName: values.contactName,
    contactPhone: normalizePhMobile(values.contactPhone)!,
    contactEmail: values.contactEmail,
    address: fulfillment.needsAddress ? toAddress(values) : undefined,
    subtotal: quote.subtotal,
    discount: quote.discountTotal,
    fulfillmentFee: fee,
    total: quote.total.add(fee),
    promoCode: quote.codeStatus === "applied" ? cart.promoCode : undefined,
    paymentMethodId: paymentMethod.id,
    lines: quote.lines.map((line) => ({
      productId: line.product.id,
      name: line.product.name,
      slug: line.product.slug,
      condition: line.product.conditionLabel,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.total,
      unitCost: unitCostOf(line.product, costs),
    })),
    units,
    // Passed as a function so the repository reads stock after taking its locks.
    readStock: getFreshStock,
  });

  if (!result.ok) {
    const catalog = await loadCatalog();
    const names = result.shortages.map((s) => catalog.findById(s.productId)?.name ?? "An item").join(", ");
    return {
      message: `Sorry, someone else just reserved ${names}. Please update your cart.`,
      values,
    };
  }

  await saveCart(new Cart());
  redirect(`/account/orders/${result.code}`);
}

export interface UploadResult {
  ok: boolean;
  message: string;
}

export async function uploadReceiptAction(_previous: UploadResult | null, formData: FormData): Promise<UploadResult> {
  const code = String(formData.get("code") ?? "");
  const user = await requireUser(`/account/orders/${code}`);

  const detail = await getOrderDetail(code);
  // Same answer for "not found" and "not yours", so order codes can't be probed.
  if (!detail || detail.order.userId !== user.id) return { ok: false, message: "Order not found." };

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a screenshot of your receipt." };
  if (file.size > MAX_RECEIPT_BYTES) return { ok: false, message: "That image is over 5 MB. Please upload a smaller screenshot." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = detectImageType(bytes);
  if (!imageType) return { ok: false, message: "Please upload a PNG, JPG or WebP image." };

  const { order } = detail;
  const objectKey = `receipts/${order.code}/${crypto.randomUUID()}.${imageType.ext}`;

  let receiptId: string;
  try {
    await putReceipt(objectKey, bytes, imageType.type);
    receiptId = await addReceipt(order.id, { objectKey, contentType: imageType.type }, user.id);
  } catch (error) {
    if (error instanceof OrderStateError) return { ok: false, message: error.message };
    throw error;
  }

  const accountName = (await getPaymentMethods()).find((m) => m.id === order.paymentMethodId)?.accountName ?? "";

  // Read the receipt after responding, so the customer isn't kept waiting.
  after(async () => {
    try {
      const text = await new TesseractReceiptReader().read(bytes);
      const check = checkReceipt(parseReceipt(text), { amount: order.amountDue, accountName });
      await saveReceiptCheck(receiptId, { text, check });
    } catch {
      await saveReceiptCheck(receiptId, { failed: "Couldn't read this receipt automatically. Please check it by eye." });
    }
  });

  return { ok: true, message: "Receipt received. We'll confirm your payment soon." };
}

// ---- Admin -----------------------------------------------------------------

export interface AdminResult {
  ok: boolean;
  message: string;
}

const NEXT_STATUS: Record<string, { to: StoredStatus; note: string }> = {
  confirm: { to: "paid", note: "Payment confirmed" },
  reject: { to: "awaiting_payment", note: "Receipt rejected" },
  complete: { to: "completed", note: "Order completed" },
  cancel: { to: "cancelled", note: "Order cancelled" },
};

export async function adminOrderAction(_previous: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const step = NEXT_STATUS[String(formData.get("step") ?? "")];
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!step) return { ok: false, message: "Unknown action." };

  try {
    await changeStatus(orderId, step.to, admin.id, reason ? `${step.note}: ${reason}` : step.note);
  } catch (error) {
    if (error instanceof OrderStateError) return { ok: false, message: error.message };
    throw error;
  }

  if (step.to !== "paid") return { ok: true, message: `${step.note}.` };

  // Paid: take the sold units out of Sanity's stock count.
  if (!canWriteStock()) {
    return {
      ok: true,
      message:
        "Payment confirmed. Stock wasn't updated in Sanity (SANITY_WRITE_TOKEN isn't set), so this order keeps holding its items.",
    };
  }
  try {
    await settleStock(orderId, admin.id, deductStock);
    revalidateTag(PRODUCTS_TAG, "max");
    return { ok: true, message: "Payment confirmed and stock updated." };
  } catch {
    await addOrderNote(orderId, "Stock update in Sanity failed; this order keeps holding its items", admin.id);
    return { ok: false, message: "Payment confirmed, but updating stock in Sanity failed. Try “Update stock” again." };
  }
}

/** Retries the Sanity stock update for a paid order. */
export async function retryStockAction(_previous: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const admin = await requireAdmin();
  const detail = await getOrderDetail(String(formData.get("code") ?? ""));
  if (!detail) return { ok: false, message: "Order not found." };
  if (!canWriteStock()) return { ok: false, message: "Set SANITY_WRITE_TOKEN first." };

  // settleStock re-checks the status and "already done" under its locks, so a double click is harmless.
  if (!(await settleStock(detail.order.id, admin.id, deductStock))) {
    return { ok: false, message: "Nothing to update." };
  }
  revalidateTag(PRODUCTS_TAG, "max");
  return { ok: true, message: "Stock updated." };
}
