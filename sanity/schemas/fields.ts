import { defineField, defineType, type FieldDefinition } from "sanity";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "@/lib/domain/money";
import { CONDITIONS } from "@/lib/domain/specs";

/** `{ "sony-e": "Sony E" }` → Studio dropdown options. */
export function toOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, title]) => ({ value, title }));
}

type Parent = Record<string, unknown> | undefined;

/** `hidden:` for fields that only apply when a sibling field has `value`. */
export const hiddenUnless =
  (field: string, value: string) =>
  ({ parent }: { parent?: unknown }) =>
    (parent as Parent)?.[field] !== value;

/** Custom rule: required only when a sibling field has `value`. */
export const requiredWhen =
  (field: string, value: string) =>
  (fieldValue: unknown, context: { parent?: unknown }) =>
    (context.parent as Parent)?.[field] !== value ||
    (fieldValue !== undefined && fieldValue !== "") ||
    "Required";

/** Fields every product has. Mirrors `ProductFields` in lib/domain/dto.ts. */
const productFields = [
  defineField({ name: "name", type: "string", validation: (r) => r.required() }),
  defineField({
    name: "slug",
    type: "slug",
    description: "The product's URL: /product/<slug>",
    options: { source: "name" },
    validation: (r) => r.required(),
  }),
  defineField({ name: "brand", type: "string", validation: (r) => r.required() }),
  defineField({
    name: "description",
    type: "text",
    rows: 3,
    description: "Shown on the product page and to search engines.",
    validation: (r) => r.required().max(500),
  }),
  defineField({
    name: "images",
    type: "array",
    of: [
      {
        type: "image",
        options: { hotspot: true },
        fields: [
          defineField({
            name: "alt",
            title: "Alt text",
            type: "string",
            description: "Describe the photo for screen readers and search engines.",
          }),
        ],
      },
    ],
  }),
];

/** Own price per currency and stock. Mirrors `StandaloneFields`. */
const standaloneFields = [
  defineField({
    name: "prices",
    type: "object",
    description: `${DEFAULT_CURRENCY} is required. Other currencies are display-only for now.`,
    options: { columns: 2 },
    validation: (r) => r.required(),
    fields: (Object.keys(CURRENCIES) as Currency[]).map((currency) =>
      defineField({
        name: currency,
        title: `${currency} price`,
        type: "number",
        validation: (r) => {
          const rule = r.min(0).precision(CURRENCIES[currency].minorUnits);
          return currency === DEFAULT_CURRENCY ? rule.required() : rule;
        },
      }),
    ),
  }),
  defineField({
    name: "stock",
    type: "number",
    description: "Used and vintage items are usually one of a kind: 1.",
    initialValue: 0,
    validation: (r) => r.required().integer().min(0),
  }),
  defineField({
    name: "condition",
    type: "string",
    options: { list: toOptions(CONDITIONS), layout: "radio", direction: "horizontal" },
    initialValue: "new",
    validation: (r) => r.required(),
  }),
  defineField({
    name: "conditionNotes",
    type: "text",
    rows: 3,
    description:
      'What a buyer of used gear wants to know, e.g. "Tested with film. Clean glass, no fungus. Light wear on the body."',
    hidden: ({ parent }) => (parent as { condition?: string } | undefined)?.condition === "new",
  }),
];

/**
 * A product document type: shared fields first, then its own. Bundles pass
 * `standalone: false` because their price and stock come from their items.
 */
export function defineProduct({
  name,
  title,
  fields,
  standalone = true,
}: {
  name: string;
  title: string;
  fields: FieldDefinition[];
  standalone?: boolean;
}) {
  return defineType({
    name,
    title,
    type: "document",
    fields: [...productFields, ...(standalone ? standaloneFields : []), ...fields],
    preview: {
      select: { title: "name", subtitle: "brand", media: "images.0" },
    },
  });
}
