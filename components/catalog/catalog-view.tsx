import Link from "next/link";
import { PlaceholderCamera } from "@/components/home/camera-shot";
import { loadCatalog } from "@/lib/data/catalog";
import { isFiltered, parseCatalogQuery, type SearchParams } from "@/lib/domain/catalog-query";
import type { ProductType } from "@/lib/domain/dto";
import { SORTS } from "@/lib/domain/sorting";
import { FilterForm } from "./filter-form";
import { ShopCard } from "./shop-card";

export interface CatalogViewProps {
  searchParams: Promise<SearchParams>;
  /** URL the filter form submits to. */
  path: string;
  /** Set on category pages to show only one product type. */
  type?: ProductType;
}

const mono = "font-mono uppercase";
const layout = "mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[18rem_1fr] lg:gap-8";

/** Filters + results, shared by /shop and every /shop/[category] page. */
export async function CatalogView({ searchParams, path, type }: CatalogViewProps) {
  const [params, catalog] = await Promise.all([searchParams, loadCatalog()]);

  const query = parseCatalogQuery(params);
  if (type) query.types = [type];

  const results = catalog.search(query);
  const facets = catalog.facets(type ? catalog.ofType(type) : catalog.products);
  const filtered = isFiltered(query);

  return (
    <div className={layout}>
      <aside aria-label="Filters" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        {/* Open by default; on small screens it collapses so products come first. */}
        <details open className="shop-filters group rounded-[22px] bg-white p-5 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 lg:pointer-events-none lg:cursor-default">
            <span className="font-[family-name:var(--font-display)] text-lg font-black uppercase">Filters</span>
            <span className="grid size-8 place-items-center rounded-full bg-[#1f160c] text-white transition-transform duration-500 group-open:rotate-180 lg:hidden">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </summary>
          <div className="pt-5">
            <FilterForm action={path} query={query} facets={facets} showTypes={!type} />
          </div>
        </details>
      </aside>

      <section aria-label="Products" className="flex min-w-0 flex-col gap-5">
        <div className={`${mono} flex flex-wrap items-center justify-between gap-3 text-[10px] tracking-[0.16em] text-black/50`}>
          <p>
            <span className="text-[#1f160c] tabular-nums">{results.length}</span>{" "}
            {results.length === 1 ? "product" : "products"}
            {filtered && " · filtered"}
          </p>
          <p>Sorted: {SORTS[query.sort].label}</p>
        </div>

        {results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((product, index) => (
              <li key={product.id} className="flex">
                <ShopCard product={product} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-5 rounded-[22px] border border-dashed border-black/20 px-6 py-16 text-center">
            <PlaceholderCamera tone="sunny" className="h-28 w-auto opacity-80" />
            {filtered && catalog.size > 0 ? (
              <>
                <p className="text-lg">No products match these filters.</p>
                <Link
                  href={path}
                  className="rounded-full bg-[#1f160c] px-6 py-3 text-sm text-white transition hover:bg-[#ee6a1c]"
                >
                  Clear filters
                </Link>
              </>
            ) : (
              <p className="text-lg">No products yet. Check back soon.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className={layout} aria-busy="true" aria-label="Loading products">
      <div className="hidden h-[28rem] animate-pulse rounded-[22px] bg-white/70 lg:block" />
      <div className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-[22px] bg-white/70" />
        ))}
      </div>
    </div>
  );
}
