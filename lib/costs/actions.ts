"use server";

import { requireAdmin } from "@/lib/auth/session";
import { parseCsv } from "@/lib/csv";
import { loadCatalog } from "@/lib/data/catalog";
import { DEFAULT_CURRENCY, Money } from "@/lib/domain/money";
import { saveCosts } from "./repository";

export interface CostsResult {
  ok: boolean;
  message: string;
  problems?: string[];
}

/** "12,500" or "12500.5" pesos → centavos; "" → null (no cost); anything else → undefined (invalid). */
function parsePesos(raw: string): number | null | undefined {
  const value = raw.trim().replace(/,/g, "").replace(/^₱/, "");
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Money.fromMajor(n, DEFAULT_CURRENCY).minor : undefined;
}

/** Saves the costs table on the Costs page (inputs named `cost:<productId>`). */
export async function saveCostsAction(_previous: CostsResult | null, formData: FormData): Promise<CostsResult> {
  await requireAdmin();
  const catalog = await loadCatalog();
  const entries: { productId: string; unitCost: number | null }[] = [];
  const problems: string[] = [];

  for (const [name, value] of formData) {
    if (!name.startsWith("cost:")) continue;
    const productId = name.slice(5);
    const product = catalog.findById(productId);
    if (!product) continue;
    const cost = parsePesos(String(value));
    if (cost === undefined) problems.push(`${product.name}: "${value}" isn't a peso amount`);
    else entries.push({ productId, unitCost: cost });
  }

  if (problems.length) return { ok: false, message: "Nothing saved. Fix these first:", problems };
  await saveCosts(entries);
  return { ok: true, message: `Saved costs for ${entries.filter((e) => e.unitCost !== null).length} products.` };
}

/** Imports a costs CSV: columns product_id (or slug) and cost_PHP. Rows without a cost are skipped. */
export async function importCostsAction(_previous: CostsResult | null, formData: FormData): Promise<CostsResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, message: "That file is over 2 MB." };

  const { headers, rows } = parseCsv(await file.text());
  const costHeader = headers.find((h) => /^cost(_php)?$/i.test(h));
  if (!costHeader || !(headers.includes("product_id") || headers.includes("slug"))) {
    return { ok: false, message: "The file needs a cost_PHP column and a product_id or slug column. Export first for a template." };
  }

  const catalog = await loadCatalog();
  const entries: { productId: string; unitCost: number }[] = [];
  const problems: string[] = [];
  rows.forEach((row, i) => {
    const line = i + 2;
    const product = catalog.findById(row.product_id ?? "") ?? catalog.find(row.slug ?? "");
    if (!product) {
      problems.push(`Row ${line}: no product with id "${row.product_id ?? ""}" or slug "${row.slug ?? ""}"`);
      return;
    }
    const cost = parsePesos(row[costHeader] ?? "");
    if (cost === null) return; // blank cost: leave as is
    if (cost === undefined) problems.push(`Row ${line} (${product.name}): "${row[costHeader]}" isn't a peso amount`);
    else entries.push({ productId: product.id, unitCost: cost });
  });

  if (problems.length) return { ok: false, message: "Nothing imported. Fix these rows first:", problems: problems.slice(0, 30) };
  await saveCosts(entries);
  return { ok: true, message: `Imported costs for ${entries.length} products.` };
}
