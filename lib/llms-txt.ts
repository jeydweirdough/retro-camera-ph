import type { Faq } from "@/lib/data/content";
import type { Catalog } from "@/lib/domain/catalog";
import { CATEGORIES } from "@/lib/domain/categories";
import { absoluteUrl, site } from "@/lib/site";

/**
 * /llms.txt: a plain-Markdown summary of the store for AI assistants
 * (https://llmstxt.org). Built from the same catalog the pages use.
 */
export function buildLlmsTxt(catalog: Catalog, faqs: Faq[]) {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Prices are in Philippine pesos (PHP). Customers pay by scanning a QR code (QR Ph, e-wallets, bank QR) at checkout.",
    "",
    `Facebook page: ${site.social.facebook}`,
    "",
    "## Shop",
    "",
    `- [All products](${absoluteUrl("/shop")}): every product, filterable by camera mount and brand`,
    ...Object.values(CATEGORIES).map(
      (category) =>
        `- [${category.label}](${absoluteUrl(`/shop/${category.slug}`)}): ${category.description}`,
    ),
  ];

  for (const category of Object.values(CATEGORIES)) {
    const products = catalog.ofType(category.type);
    if (products.length === 0) continue;

    lines.push("", `## ${category.label}`, "");
    for (const product of products) {
      const specs = product.getSpecs().map((spec) => `${spec.label}: ${spec.value}`).join("; ");
      const stock = product.inStock ? "in stock" : "out of stock";
      lines.push(
        `- [${product.name}](${absoluteUrl(product.path)}): ${product.price().format()}, ${product.conditionLabel}, ${stock}. ${specs}`,
      );
    }
  }

  if (faqs.length > 0) {
    lines.push("", "## FAQ", "");
    for (const faq of faqs) lines.push(`### ${faq.question}`, "", faq.answer, "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
