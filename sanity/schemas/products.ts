import { defineField } from "sanity";
import { CAMERA_MEDIA } from "@/lib/domain/camera";
import {
  FILM_CAMERA_STYLES,
  FILM_FORMATS,
  LENS_MOUNTS,
  MOUNTS,
  SENSORS,
} from "@/lib/domain/specs";
import { defineProduct, hiddenUnless, requiredWhen, toOptions } from "./fields";

const digitalOnly = { hidden: hiddenUnless("medium", "digital") };
const filmOnly = { hidden: hiddenUnless("medium", "film") };

export const camera = defineProduct({
  name: "camera",
  title: "Camera",
  fields: [
    defineField({
      name: "medium",
      title: "Digital or film",
      type: "string",
      options: { list: toOptions(CAMERA_MEDIA), layout: "radio", direction: "horizontal" },
      initialValue: "digital",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "mount",
      type: "string",
      description: 'Use "Fixed lens" for point-and-shoots and other cameras with a built-in lens.',
      options: { list: toOptions(MOUNTS) },
      validation: (r) => r.required(),
    }),

    defineField({
      name: "sensor",
      type: "string",
      options: { list: toOptions(SENSORS) },
      ...digitalOnly,
      validation: (r) => r.custom(requiredWhen("medium", "digital")),
    }),
    defineField({
      name: "megapixels",
      type: "number",
      ...digitalOnly,
      validation: (r) => r.min(1).custom(requiredWhen("medium", "digital")),
    }),
    defineField({
      name: "video",
      type: "string",
      description: 'Best video mode, e.g. "4K 60p", or "None".',
      ...digitalOnly,
      validation: (r) => r.custom(requiredWhen("medium", "digital")),
    }),

    defineField({
      name: "filmFormat",
      type: "string",
      options: { list: toOptions(FILM_FORMATS) },
      ...filmOnly,
      validation: (r) => r.custom(requiredWhen("medium", "film")),
    }),
    defineField({
      name: "style",
      title: "Camera style",
      type: "string",
      options: { list: toOptions(FILM_CAMERA_STYLES) },
      ...filmOnly,
      validation: (r) => r.custom(requiredWhen("medium", "film")),
    }),
  ],
});

export const lens = defineProduct({
  name: "lens",
  title: "Lens",
  fields: [
    defineField({
      name: "mount",
      type: "string",
      options: { list: toOptions(LENS_MOUNTS) },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "focalLength",
      title: "Focal length (mm)",
      type: "object",
      description: "For a prime lens, enter the same number twice.",
      options: { columns: 2 },
      fields: [
        defineField({ name: "min", type: "number", validation: (r) => r.required().min(1) }),
        defineField({
          name: "max",
          type: "number",
          validation: (r) =>
            r.required().custom((max, context) => {
              const min = (context.parent as { min?: number } | undefined)?.min;
              return min === undefined || (max ?? 0) >= min || "Max must be at least min";
            }),
        }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "maxAperture",
      title: "Max aperture (f/)",
      type: "number",
      validation: (r) => r.required().min(0.7),
    }),
    defineField({ name: "stabilized", type: "boolean", initialValue: false }),
  ],
});

export const accessory = defineProduct({
  name: "accessory",
  title: "Accessory",
  fields: [
    defineField({
      name: "kind",
      title: "Accessory type",
      type: "string",
      description: 'e.g. "Memory cards", "Batteries", "Bags".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "compatibleMounts",
      type: "array",
      description: "Leave empty if it works with every camera (cards, bags, tripods).",
      of: [{ type: "string" }],
      options: { list: toOptions(MOUNTS) },
    }),
  ],
});

export const bundle = defineProduct({
  name: "bundle",
  title: "Bundle / Kit",
  standalone: false,
  fields: [
    defineField({
      name: "items",
      type: "array",
      description: "Price and stock are calculated from these items.",
      validation: (r) => r.required().min(1),
      of: [
        {
          type: "object",
          name: "bundleItem",
          fields: [
            defineField({
              name: "product",
              type: "reference",
              to: [{ type: "camera" }, { type: "lens" }, { type: "accessory" }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: "quantity",
              type: "number",
              initialValue: 1,
              validation: (r) => r.required().integer().min(1),
            }),
          ],
          preview: {
            select: { title: "product.name", quantity: "quantity", media: "product.images.0" },
            prepare: ({ title, quantity, media }) => ({ title: `${quantity}× ${title}`, media }),
          },
        },
      ],
    }),
    defineField({
      name: "discountPercent",
      title: "Bundle discount (%)",
      type: "number",
      initialValue: 0,
      validation: (r) => r.required().min(0).max(99),
    }),
  ],
});
