import type { ShippingAddress } from "@/lib/db/schema";

export interface CheckoutValues {
  fulfillment: string;
  paymentMethodId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>;

const ADDRESS_FIELDS = ["street", "barangay", "city", "province", "postalCode"] as const;

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim().slice(0, 300);

export function readCheckoutForm(formData: FormData): CheckoutValues {
  return {
    fulfillment: text(formData, "fulfillment"),
    paymentMethodId: text(formData, "paymentMethodId"),
    contactName: text(formData, "contactName"),
    contactPhone: text(formData, "contactPhone"),
    contactEmail: text(formData, "contactEmail"),
    street: text(formData, "street"),
    barangay: text(formData, "barangay"),
    city: text(formData, "city"),
    province: text(formData, "province"),
    postalCode: text(formData, "postalCode"),
    notes: text(formData, "notes"),
  };
}

/** "0917 123 4567", "+63 917-123-4567" → "+639171234567"; null if not a PH mobile number. */
export function normalizePhMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const match = digits.match(/^(?:\+?63|0)(9\d{9})$/);
  return match ? `+63${match[1]}` : null;
}

export function validateCheckout(values: CheckoutValues, needsAddress: boolean) {
  const errors: CheckoutErrors = {};
  if (!values.contactName) errors.contactName = "Enter the name for this order.";
  if (!normalizePhMobile(values.contactPhone)) errors.contactPhone = "Enter a PH mobile number, e.g. 0917 123 4567.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) errors.contactEmail = "Enter a valid email.";
  if (!values.paymentMethodId) errors.paymentMethodId = "Choose how you'll pay.";

  if (needsAddress) {
    for (const field of ADDRESS_FIELDS) if (!values[field]) errors[field] = "Required for delivery.";
    if (values.postalCode && !/^\d{4}$/.test(values.postalCode)) errors.postalCode = "Use the 4-digit ZIP code.";
  }
  return errors;
}

export function toAddress(values: CheckoutValues): ShippingAddress {
  return {
    street: values.street,
    barangay: values.barangay,
    city: values.city,
    province: values.province,
    postalCode: values.postalCode,
    ...(values.notes && { notes: values.notes }),
  };
}
