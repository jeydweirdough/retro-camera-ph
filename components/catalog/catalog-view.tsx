import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { loadCatalog } from "@/lib/data/catalog";
import { isFiltered, parseCatalogQuery, type SearchParams } from "@/lib/domain/catalog-query";
import type { ProductType } from "@/lib/domain/dto";
import { FilterForm } from "./filter-form";

export interface CatalogViewProps {
  searchParams: Promise<SearchParams>;
  /** URL the filter form submits to. */
  path: string;
  /** Set on category pages to show only one product type. */
  type?: ProductType;
}

/** Filters + results, shared by /shop and every /shop/[category] page. */
export async function CatalogView({ searchParams, path, type }: CatalogViewProps) {
  const [params, catalog] = await Promise.all([searchParams, loadCatalog()]);

  const query = parseCatalogQuery(params);
  if (type) query.types = [type];

  const results = catalog.search(query);
  const facets = catalog.facets(type ? catalog.ofType(type) : catalog.products);

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
      <aside aria-label="Filters">
        <FilterForm action={path} query={query} facets={facets} showTypes={!type} />
      </aside>

      <section aria-label="Products" className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">
          {results.length} {results.length === 1 ? "product" : "products"}
        </p>
        <ProductGrid
          products={results}
          empty={
            isFiltered(query) && catalog.size > 0 ? (
              <>
                No products match these filters.{" "}
                <Link href={path} className="font-medium text-brand-700 underline dark:text-brand-400">
                  Clear filters
                </Link>
              </>
            ) : undefined
          }
        />
      </section>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_1fr]" aria-busy="true" aria-label="Loading products">
      <div className="hidden h-96 animate-pulse rounded-xl bg-zinc-100 lg:block dark:bg-zinc-900" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
