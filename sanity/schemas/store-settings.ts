import { defineField, defineType } from "sanity";
import { DEFAULT_CURRENCY } from "@/lib/domain/money";

/** One document (see sanity.config.ts): delivery and pickup options for checkout. */
export const storeSettings = defineType({
  name: "storeSettings",
  title: "Store settings",
  type: "document",
  fields: [
    defineField({
      name: "deliveryFee",
      title: `Delivery fee (${DEFAULT_CURRENCY})`,
      type: "number",
      description: "Flat fee for every delivery order.",
      validation: (r) => r.required().min(0).precision(2),
    }),
    defineField({
      name: "freeDeliveryMinimum",
      title: `Free delivery from (${DEFAULT_CURRENCY})`,
      type: "number",
      description: "Orders at or above this amount ship free. Leave empty to always charge.",
      validation: (r) => r.min(0).precision(2),
    }),
    defineField({
      name: "pickupEnabled",
      title: "Offer store pickup",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "pickupAddress",
      type: "text",
      rows: 2,
      hidden: ({ parent }) => !(parent as { pickupEnabled?: boolean } | undefined)?.pickupEnabled,
      validation: (r) =>
        r.custom((address, context) =>
          !(context.parent as { pickupEnabled?: boolean } | undefined)?.pickupEnabled || address
            ? true
            : "Required when pickup is offered",
        ),
    }),
    defineField({
      name: "pickupHours",
      type: "string",
      description: 'e.g. "Mon–Sat, 10am–6pm".',
      hidden: ({ parent }) => !(parent as { pickupEnabled?: boolean } | undefined)?.pickupEnabled,
    }),
  ],
  preview: { prepare: () => ({ title: "Store settings" }) },
});
