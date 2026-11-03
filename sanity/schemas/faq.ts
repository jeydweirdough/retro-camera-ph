import { defineField, defineType } from "sanity";

/**
 * Store questions and answers (shipping, warranty, payment). Shown on the home
 * page and marked up as FAQPage data so search and AI engines can quote them.
 */
export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({ name: "question", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "answer",
      type: "text",
      rows: 4,
      description: "Answer in the first sentence; AI engines often quote only that.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      description: "Lower numbers show first.",
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: "Display order", name: "sortOrder", by: [{ field: "sortOrder", direction: "asc" }] },
  ],
  preview: { select: { title: "question", subtitle: "answer" } },
});
