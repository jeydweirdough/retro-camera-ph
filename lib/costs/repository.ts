import { inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { productCosts } from "@/lib/db/schema";

/** Unit costs in centavos, by product id. Server-only: costs are private. */
export async function getCostMap(productIds?: string[]): Promise<Map<string, number>> {
  if (productIds && productIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ productId: productCosts.productId, unitCost: productCosts.unitCost })
    .from(productCosts)
    .where(productIds ? inArray(productCosts.productId, productIds) : undefined);
  return new Map(rows.map((row) => [row.productId, row.unitCost]));
}

/** Saves costs; null removes a product's cost. All or nothing. */
export async function saveCosts(entries: { productId: string; unitCost: number | null }[]) {
  const set = entries.filter((e): e is { productId: string; unitCost: number } => e.unitCost !== null);
  const removed = entries.filter((e) => e.unitCost === null).map((e) => e.productId);

  await getDb().transaction(async (tx) => {
    if (set.length > 0) {
      await tx
        .insert(productCosts)
        .values(set.map((e) => ({ productId: e.productId, unitCost: e.unitCost })))
        .onConflictDoUpdate({
          target: productCosts.productId,
          set: { unitCost: sql`excluded.unit_cost`, updatedAt: sql`now()` },
        });
    }
    if (removed.length > 0) await tx.delete(productCosts).where(inArray(productCosts.productId, removed));
  });
}
