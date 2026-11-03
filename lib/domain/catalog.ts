import { Camera } from "./camera";
import { CONDITION_FILTERS, type CatalogQuery, type ConditionFilter } from "./catalog-query";
import { CompatibilityIndex } from "./compatibility-index";
import type { ProductDTO, ProductType } from "./dto";
import { DEFAULT_CURRENCY, type Currency } from "./money";
import type { Product } from "./product";
import { productFromDTO } from "./product-factory";
import { SORTS } from "./sorting";
import { MOUNTS, type Mount } from "./specs";

export interface Facet<T extends string = string> {
  value: T;
  label: string;
  count: number;
}

/** The whole product list, with fast lookups, filtering, sorting and facets. */
export class Catalog {
  private readonly bySlug: Map<string, Product>;
  private readonly byId: Map<string, Product>;
  private readonly compatibility: CompatibilityIndex;

  constructor(readonly products: readonly Product[]) {
    this.bySlug = new Map(products.map((product) => [product.slug, product]));
    this.byId = new Map(products.map((product) => [product.id, product]));
    this.compatibility = new CompatibilityIndex(products);
  }

  static fromDTOs(dtos: ProductDTO[]) {
    return new Catalog(dtos.map(productFromDTO));
  }

  get size() {
    return this.products.length;
  }

  find(slug: string) {
    return this.bySlug.get(slug);
  }

  /** Carts store IDs: slugs can be renamed in Sanity, IDs never change. */
  findById(id: string) {
    return this.byId.get(id);
  }

  ofType(type: ProductType) {
    return this.products.filter((product) => product.type === type);
  }

  cameras(): Camera[] {
    return this.products.filter((product) => product instanceof Camera);
  }

  /** Lenses and accessories usable with a camera of `mount`. */
  fitting(mount: Mount) {
    return this.compatibility.forMount(mount);
  }

  search(query: CatalogQuery, currency: Currency = DEFAULT_CURRENCY): Product[] {
    const types = new Set(query.types);
    const brands = new Set(query.brands);
    const conditions = new Set(query.conditions);

    const matches = this.products.filter(
      (product) =>
        (types.size === 0 || types.has(product.type)) &&
        (brands.size === 0 || brands.has(product.brand)) &&
        (query.mounts.length === 0 || query.mounts.some((m) => product.matchesMount(m))) &&
        (conditions.size === 0 || conditions.has(conditionFilterOf(product))) &&
        (!query.inStock || product.inStock),
    );

    const { compare } = SORTS[query.sort];
    return matches.sort((a, b) => compare(a, b, currency));
  }

  /** Filter options with how many products each one has. */
  facets(products: readonly Product[] = this.products) {
    const brands = new Map<string, number>();
    for (const product of products) brands.set(product.brand, (brands.get(product.brand) ?? 0) + 1);

    return {
      brands: [...brands]
        .map(([value, count]): Facet => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      mounts: (Object.keys(MOUNTS) as Mount[])
        .map((value): Facet<Mount> => ({
          value,
          label: MOUNTS[value],
          count: products.filter((product) => product.matchesMount(value)).length,
        }))
        .filter((facet) => facet.count > 0),
      conditions: (Object.keys(CONDITION_FILTERS) as ConditionFilter[])
        .map((value): Facet<ConditionFilter> => ({
          value,
          label: CONDITION_FILTERS[value],
          count: products.filter((product) => conditionFilterOf(product) === value).length,
        }))
        .filter((facet) => facet.count > 0),
    };
  }
}

const conditionFilterOf = (product: Product): ConditionFilter => (product.isUsed ? "used" : "new");
