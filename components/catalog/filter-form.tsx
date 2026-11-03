import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronIcon } from "@/components/home/ui";
import type { Catalog } from "@/lib/domain/catalog";
import type { CatalogQuery } from "@/lib/domain/catalog-query";
import { CATEGORIES } from "@/lib/domain/categories";
import { SORTS, type SortKey } from "@/lib/domain/sorting";

export interface FilterFormProps {
  action: string;
  query: CatalogQuery;
  facets: ReturnType<Catalog["facets"]>;
  /** Category pages already fix the type, so they hide that filter. */
  showTypes: boolean;
}

const mono = "font-mono uppercase";

/**
 * A plain GET form: filters live in the URL, work without JavaScript, and
 * every filtered view can be bookmarked or shared.
 */
export function FilterForm({ action, query, facets, showTypes }: FilterFormProps) {
  return (
    <form action={action} method="get" className="flex flex-col gap-6 text-sm">
      <label className="flex flex-col gap-2">
        <span className={`${mono} text-[10px] tracking-[0.16em] text-black/50`}>Sort by</span>
        <span className="relative">
          <select
            name="sort"
            defaultValue={query.sort}
            className="h-11 w-full cursor-pointer appearance-none rounded-full border border-black/15 bg-[#f6f2ea] pr-10 pl-4 transition-colors hover:border-[#1f160c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee6a1c]"
          >
            {(Object.keys(SORTS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORTS[key].label}
              </option>
            ))}
          </select>
          <ChevronIcon className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 rotate-90" />
        </span>
      </label>

      {showTypes && (
        <ChipGroup legend="Category">
          {Object.values(CATEGORIES).map((category) => (
            <Chip
              key={category.type}
              name="type"
              value={category.type}
              label={category.label}
              checked={query.types.includes(category.type)}
            />
          ))}
        </ChipGroup>
      )}

      {facets.conditions.length > 1 && (
        <ChipGroup legend="Condition">
          {facets.conditions.map((facet) => (
            <Chip
              key={facet.value}
              name="condition"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.conditions.includes(facet.value)}
            />
          ))}
        </ChipGroup>
      )}

      {facets.mounts.length > 0 && (
        <ChipGroup legend="Camera mount">
          {facets.mounts.map((facet) => (
            <Chip
              key={facet.value}
              name="mount"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.mounts.includes(facet.value)}
            />
          ))}
        </ChipGroup>
      )}

      {facets.brands.length > 0 && (
        <ChipGroup legend="Brand">
          {facets.brands.map((facet) => (
            <Chip
              key={facet.value}
              name="brand"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.brands.includes(facet.value)}
            />
          ))}
        </ChipGroup>
      )}

      <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-dashed border-black/15 pt-5">
        <span>In stock only</span>
        <input type="checkbox" name="inStock" value="1" defaultChecked={query.inStock} className="peer sr-only" />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-black/15 transition-colors peer-checked:bg-[#ee6a1c] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#ee6a1c] after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          className="group inline-flex items-center gap-2 rounded-full bg-[#ee6a1c] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(238,106,28,0.9)] transition-all duration-300 hover:gap-3 hover:bg-[#ff7a26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f160c]"
        >
          Apply filters
          <ChevronIcon className="size-3.5" />
        </button>
        <Link href={action} className={`${mono} text-[10px] tracking-[0.16em] text-black/50 underline-offset-4 hover:text-black hover:underline`}>
          Clear
        </Link>
      </div>
    </form>
  );
}

function ChipGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-dashed border-black/15 pt-5">
      <legend className={`${mono} float-left mb-3 w-full text-[10px] tracking-[0.16em] text-black/50`}>{legend}</legend>
      <div className="clear-both flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** A checkbox drawn as a pill: filled ink when checked. */
function Chip({
  name,
  value,
  label,
  count,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  count?: number;
  checked: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="flex items-center gap-1.5 rounded-full border border-black/15 px-3.5 py-1.5 text-[13px] transition-colors duration-300 peer-checked:border-[#1f160c] peer-checked:bg-[#1f160c] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#ee6a1c] hover:border-[#1f160c]">
        {label}
        {count !== undefined && <span className="font-mono text-[10px] opacity-50">{count}</span>}
      </span>
    </label>
  );
}
