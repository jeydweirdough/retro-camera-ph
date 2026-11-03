import { createClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId } from "@/sanity/env";

/** Whether paid orders can update stock in Sanity automatically. */
export const canWriteStock = () => isSanityConfigured && Boolean(process.env.SANITY_WRITE_TOKEN);

/**
 * Subtracts sold units from each product's stock in Sanity, in one
 * all-or-nothing transaction. Needs SANITY_WRITE_TOKEN (server-only).
 */
export async function deductStock(units: { productId: string; quantity: number }[]) {
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
  });
  const transaction = client.transaction();
  for (const { productId, quantity } of units) {
    transaction.patch(productId, (patch) => patch.dec({ stock: quantity }));
  }
  await transaction.commit();
}
