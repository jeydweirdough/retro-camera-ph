import Link from "next/link";
import type { ReactNode } from "react";
import { PrimaryButton } from "@/components/ui/button/primary-button";
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

/**
 * A plain GET form: filters live in the URL, work without JavaScript, and
 * every filtered view can be bookmarked or shared.
 */
export function FilterForm({ action, query, facets, showTypes }: FilterFormProps) {
  return (
    <form action={action} method="get" className="flex flex-col gap-6 text-sm">
      <label className="flex flex-col gap-1.5">
        <span className="font-medium">Sort by</span>
        <select
          name="sort"
          defaultValue={query.sort}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORTS[key].label}
            </option>
          ))}
        </select>
      </label>

      {showTypes && (
        <CheckboxGroup legend="Category">
          {Object.values(CATEGORIES).map((category) => (
            <Checkbox
              key={category.type}
              name="type"
              value={category.type}
              label={category.label}
              checked={query.types.includes(category.type)}
            />
          ))}
        </CheckboxGroup>
      )}

      {facets.conditions.length > 1 && (
        <CheckboxGroup legend="Condition">
          {facets.conditions.map((facet) => (
            <Checkbox
              key={facet.value}
              name="condition"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.conditions.includes(facet.value)}
            />
          ))}
        </CheckboxGroup>
      )}

      {facets.mounts.length > 0 && (
        <CheckboxGroup legend="Camera mount">
          {facets.mounts.map((facet) => (
            <Checkbox
              key={facet.value}
              name="mount"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.mounts.includes(facet.value)}
            />
          ))}
        </CheckboxGroup>
      )}

      {facets.brands.length > 0 && (
        <CheckboxGroup legend="Brand">
          {facets.brands.map((facet) => (
            <Checkbox
              key={facet.value}
              name="brand"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              checked={query.brands.includes(facet.value)}
            />
          ))}
        </CheckboxGroup>
      )}

      <Checkbox name="inStock" value="1" label="In stock only" checked={query.inStock} />

      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" size="sm">
          Apply filters
        </PrimaryButton>
        <Link href={action} className="text-zinc-500 underline-offset-4 hover:underline">
          Clear
        </Link>
      </div>
    </form>
  );
}

function CheckboxGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Checkbox({
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
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="h-4 w-4 accent-brand-600"
      />
      <span>{label}</span>
      {count !== undefined && <span className="text-zinc-400">({count})</span>}
    </label>
  );
}
