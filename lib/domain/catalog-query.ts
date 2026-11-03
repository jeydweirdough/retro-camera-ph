import { CATEGORIES } from "./categories";
import type { ProductType } from "./dto";
import { isSortKey, type SortKey } from "./sorting";
import { MOUNTS, type Mount } from "./specs";

export const CONDITION_FILTERS = { new: "New", used: "Used / vintage" } as const;
export type ConditionFilter = keyof typeof CONDITION_FILTERS;

/** What the shopper asked for: filters + sort, parsed from the URL. */
export interface CatalogQuery {
  types: ProductType[];
  brands: string[];
  mounts: Mount[];
  conditions: ConditionFilter[];
  inStock: boolean;
  sort: SortKey;
}

export type SearchParams = Record<string, string | string[] | undefined>;

const list = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const isProductType = (value: string): value is ProductType => Object.hasOwn(CATEGORIES, value);
const isMount = (value: string): value is Mount => Object.hasOwn(MOUNTS, value);
const isConditionFilter = (value: string): value is ConditionFilter =>
  Object.hasOwn(CONDITION_FILTERS, value);

/** Unknown values are dropped, so a hand-edited URL can't break the page. */
export function parseCatalogQuery(params: SearchParams): CatalogQuery {
  const sort = list(params.sort)[0] ?? "";
  return {
    types: list(params.type).filter(isProductType),
    brands: list(params.brand).filter(Boolean),
    mounts: list(params.mount).filter(isMount),
    conditions: list(params.condition).filter(isConditionFilter),
    inStock: list(params.inStock)[0] === "1",
    sort: isSortKey(sort) ? sort : "featured",
  };
}

export function isFiltered(query: CatalogQuery) {
  return (
    query.types.length + query.brands.length + query.mounts.length + query.conditions.length > 0 ||
    query.inStock ||
    query.sort !== "featured"
  );
}
