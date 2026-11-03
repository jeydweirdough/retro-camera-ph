import { cacheLife, cacheTag } from "next/cache";
import { Catalog } from "@/lib/domain/catalog";
import { isSanityConfigured } from "@/sanity/env";
import type { ProductRepository } from "./product-repository";
import { SampleProductRepository } from "./sample-repository";
import { SanityProductRepository } from "./sanity-repository";

/** Sanity when configured, sample data otherwise. Pages never know which. */
const repository: ProductRepository = isSanityConfigured
  ? new SanityProductRepository()
  : new SampleProductRepository();

/** Tag to revalidate when products change in Sanity. */
export const PRODUCTS_TAG = "products";

/** Cached plain data. Classes can't be cached, so this returns DTOs. */
export async function getAllProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);
  return repository.all();
}

/** The catalog as domain objects, built from the cached data. */
export async function loadCatalog() {
  return Catalog.fromDTOs(await getAllProducts());
}

/** Live stock counts for checkout. Not cached. */
export function getFreshStock(productIds: string[]) {
  return repository.stockFor(productIds);
}
