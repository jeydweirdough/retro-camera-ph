import { defineField, defineType } from "sanity";
import { toOptions } from "./fields";

export const PAYMENT_METHOD_TYPES = {
  qrph: "QR Ph",
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank QR",
} as const;

/**
 * A QR code customers scan to pay. Only store owners should be allowed to
 * edit these: whoever can swap the QR image can redirect payments.
 */
export const paymentMethod = defineType({
  name: "paymentMethod",
  title: "Payment method",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: 'Shown at checkout, e.g. "GCash" or "BPI QR Ph".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "type",
      type: "string",
      options: { list: toOptions(PAYMENT_METHOD_TYPES), layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "qrCode",
      title: "QR code",
      type: "image",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "accountName",
      type: "string",
      description: "Must match the name on payment receipts. Used by the receipt check.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "accountNumberLast4",
      title: "Account number (last 4 digits)",
      type: "string",
      description: "Shown to customers so they can confirm before paying. Never the full number.",
      validation: (r) => r.required().regex(/^\d{4}$/, { name: "4 digits" }),
    }),
    defineField({
      name: "instructions",
      type: "text",
      rows: 3,
      description: "Optional extra steps shown under the QR code.",
    }),
    defineField({
      name: "enabled",
      type: "boolean",
      description: "Turn off to hide this method from checkout.",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      description: "Lower numbers show first.",
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: "Checkout order", name: "sortOrder", by: [{ field: "sortOrder", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "accountName", media: "qrCode", enabled: "enabled" },
    prepare: ({ title, subtitle, media, enabled }) => ({
      title: enabled === false ? `${title} (off)` : title,
      subtitle,
      media,
    }),
  },
});
