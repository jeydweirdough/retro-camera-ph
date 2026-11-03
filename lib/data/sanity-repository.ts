import type { SanityClient } from "next-sanity";
import type { ProductRepository } from "./product-repository";
import { getSanityClient } from "./sanity-client";
import { PRODUCT_PROJECTION, sanityToDTO, type SanityProduct } from "./sanity-mapper";

const PRODUCT_TYPES = ["camera", "lens", "accessory", "bundle"];

const PRODUCT_QUERY = `{
  ${PRODUCT_PROJECTION},
  items[]{ quantity, "product": product->{ ${PRODUCT_PROJECTION} } }
}`;

export class SanityProductRepository implements ProductRepository {
  constructor(private readonly client: SanityClient = getSanityClient()) {}

  async all() {
    const raw = await this.client.fetch<SanityProduct[]>(
      `*[_type in $types && defined(slug.current)] | order(name asc) ${PRODUCT_QUERY}`,
      { types: PRODUCT_TYPES },
    );
    return raw.map(sanityToDTO);
  }

  async findBySlug(slug: string) {
    const raw = await this.client.fetch<SanityProduct | null>(
      `*[_type in $types && slug.current == $slug][0] ${PRODUCT_QUERY}`,
      { types: PRODUCT_TYPES, slug },
    );
    return raw ? sanityToDTO(raw) : null;
  }

  async stockFor(productIds: string[]) {
    // Straight from the API, skipping the CDN: stock must be current at checkout.
    const rows = await this.client
      .withConfig({ useCdn: false })
      .fetch<{ _id: string; stock: number | null }[]>(`*[_id in $ids]{ _id, stock }`, { ids: productIds });
    return new Map(rows.map((row) => [row._id, row.stock ?? 0]));
  }
}
