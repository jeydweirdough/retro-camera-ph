import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { CostsImportForm, CostsTableForm } from "@/components/admin/costs-forms";
import { LinkButton } from "@/components/ui/button/link-button";
import { Card } from "@/components/ui/card/card";
import { requireAdmin } from "@/lib/auth/session";
import { getCostMap } from "@/lib/costs/repository";
import { loadCatalog } from "@/lib/data/catalog";
import { Money } from "@/lib/domain/money";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: costs", robots: { index: false } };

export default function CostsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Costs</h1>
      <AdminNav current="/admin/costs" />
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <Costs />
      </Suspense>
    </>
  );
}

async function Costs() {
  await requireAdmin();
  const catalog = await loadCatalog();
  // Kits cost the sum of their parts, so only products sold on their own are listed.
  const products = catalog.products.filter((p) => p.type !== "bundle");
  const costs = await getCostMap(products.map((p) => p.id));
  const missing = products.filter((p) => !costs.has(p.id)).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        What you paid per unit, in pesos. Used for profit, margin and ROI in Reports. Costs are stored privately in the
        store database, never in Sanity (which is publicly readable), and each order keeps the cost from when it sold.
        {missing > 0 && <strong className="text-amber-700 dark:text-amber-400"> {missing} products have no cost yet.</strong>}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium">Export</p>
          <p className="text-xs text-zinc-500">Every product with its current cost. Edit it in a spreadsheet and import it back.</p>
          <LinkButton href="/admin/costs/export" variant="secondary" size="sm" className="self-start" prefetch={false}>
            Download costs CSV
          </LinkButton>
        </Card>
        <Card>
          <CostsImportForm />
        </Card>
      </div>

      <CostsTableForm>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left text-zinc-500">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th scope="col" className="py-2 pr-3 font-normal">Product</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Stock</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">List price</th>
                <th scope="col" className="py-2 pr-3 font-normal">Cost per unit (₱)</th>
                <th scope="col" className="py-2 text-right font-normal">Margin at list price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums dark:divide-zinc-900">
              {products.map((product) => {
                const cost = costs.get(product.id);
                const price = product.price();
                const margin = cost !== undefined && price.minor > 0 ? (price.minor - cost) / price.minor : null;
                return (
                  <tr key={product.id}>
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      {product.name}
                      <span className="block text-xs text-zinc-500">
                        {product.category.label} · {product.conditionLabel}
                      </span>
                    </th>
                    <td className="py-2 pr-3 text-right">{product.stock}</td>
                    <td className="py-2 pr-3 text-right">{price.format()}</td>
                    <td className="py-2 pr-3">
                      <label>
                        <span className="sr-only">Cost per unit for {product.name}</span>
                        <input
                          name={`cost:${product.id}`}
                          inputMode="decimal"
                          defaultValue={cost !== undefined ? Money.ofMinor(cost).toDecimalString() : ""}
                          placeholder="Not set"
                          className="h-9 w-32 rounded-lg border border-zinc-300 bg-white px-2 text-right dark:border-zinc-700 dark:bg-zinc-950"
                        />
                      </label>
                    </td>
                    <td className="py-2 text-right">{formatPercent(margin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CostsTableForm>
    </div>
  );
}
