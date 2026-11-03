import type { ProductDTO } from "@/lib/domain/dto";

/**
 * Where product data comes from. Pages depend on this contract only, so the
 * sample data can be swapped for Sanity without touching any page.
 *
 * Returns plain DTOs (not classes) so results can be cached with `use cache`.
 */
export interface ProductRepository {
  all(): Promise<ProductDTO[]>;
  findBySlug(slug: string): Promise<ProductDTO | null>;
  /** Current stock counts, never cached: used when placing an order. */
  stockFor(productIds: string[]): Promise<Map<string, number>>;
}
