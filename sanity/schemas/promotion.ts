import { defineField, defineType } from "sanity";
import { CATEGORIES } from "@/lib/domain/categories";
import { DEFAULT_CURRENCY } from "@/lib/domain/money";
import { hiddenUnless, requiredWhen } from "./fields";

const PROMOTION_TYPES = [
  { value: "percentOff", title: "Percent off" },
  { value: "fixedOff", title: `Fixed amount off (${DEFAULT_CURRENCY})` },
  { value: "buyXGetY", title: "Buy X, get Y free" },
];

/** Mirrors the Promotion classes in lib/domain/promotion.ts. */
export const promotion = defineType({
  name: "promotion",
  title: "Promotion",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Shown in the cart next to the discount.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "type",
      type: "string",
      options: { list: PROMOTION_TYPES, layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "code",
      type: "string",
      description:
        "Leave empty to apply automatically to every cart that qualifies. Letters, numbers and dashes.",
      validation: (r) => r.uppercase().regex(/^[A-Z0-9-]+$/, { name: "code" }).max(32),
    }),

    defineField({
      name: "percent",
      type: "number",
      hidden: hiddenUnless("type", "percentOff"),
      validation: (r) => r.min(1).max(90).custom(requiredWhen("type", "percentOff")),
    }),
    defineField({
      name: "appliesTo",
      title: "Applies to",
      type: "array",
      description: "Leave empty for everything.",
      hidden: hiddenUnless("type", "percentOff"),
      of: [{ type: "string" }],
      options: {
        list: Object.values(CATEGORIES).map((c) => ({ value: c.type, title: c.label })),
      },
    }),

    defineField({
      name: "amount",
      title: `Amount off (${DEFAULT_CURRENCY})`,
      type: "number",
      hidden: hiddenUnless("type", "fixedOff"),
      validation: (r) => r.min(1).precision(2).custom(requiredWhen("type", "fixedOff")),
    }),

    defineField({
      name: "product",
      type: "reference",
      to: [{ type: "camera" }, { type: "lens" }, { type: "accessory" }],
      hidden: hiddenUnless("type", "buyXGetY"),
      validation: (r) => r.custom(requiredWhen("type", "buyXGetY")),
    }),
    defineField({
      name: "buy",
      type: "number",
      initialValue: 2,
      hidden: hiddenUnless("type", "buyXGetY"),
      validation: (r) => r.integer().min(1).custom(requiredWhen("type", "buyXGetY")),
    }),
    defineField({
      name: "get",
      title: "Get free",
      type: "number",
      initialValue: 1,
      hidden: hiddenUnless("type", "buyXGetY"),
      validation: (r) => r.integer().min(1).custom(requiredWhen("type", "buyXGetY")),
    }),

    defineField({
      name: "minSubtotal",
      title: `Minimum spend (${DEFAULT_CURRENCY})`,
      type: "number",
      description: "Leave empty for no minimum.",
      validation: (r) => r.min(0).precision(2),
    }),
    defineField({ name: "startsAt", type: "datetime" }),
    defineField({
      name: "endsAt",
      type: "datetime",
      validation: (r) =>
        r.custom((endsAt, context) => {
          const startsAt = (context.parent as { startsAt?: string } | undefined)?.startsAt;
          return !endsAt || !startsAt || endsAt > startsAt || "Must end after it starts";
        }),
    }),
    defineField({
      name: "enabled",
      type: "boolean",
      description: "Turn off to pause this promotion.",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", code: "code", enabled: "enabled" },
    prepare: ({ title, code, enabled }) => ({
      title: enabled === false ? `${title} (off)` : title,
      subtitle: code ? `Code: ${code}` : "Automatic",
    }),
  },
});
