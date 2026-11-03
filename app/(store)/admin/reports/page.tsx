import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { BreakdownTable } from "@/components/admin/breakdown-table";
import { SalesChart } from "@/components/admin/sales-chart";
import { StatTile } from "@/components/admin/stat-tile";
import { LinkButton } from "@/components/ui/button/link-button";
import { Card } from "@/components/ui/card/card";
import { requireAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { parseRange, REPORT_RANGES, type ReportRange } from "@/lib/domain/reports";
import { formatDateTime, formatPercent } from "@/lib/format";
import { loadReports } from "@/lib/reports/load";

export const metadata: Metadata = { title: "Admin: reports", robots: { index: false } };

export default function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
      <AdminNav current="/admin/reports" />
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        {searchParams.then((params) => (
          <Reports range={parseRange(params.range)} />
        ))}
      </Suspense>
    </>
  );
}

async function Reports({ range }: { range: ReportRange }) {
  await requireAdmin();
  const { from, to, sales, series, inventory } = await loadReports(range);
  const s = sales.summary;
  const coverage = s.costCoverage;

  return (
    <div className="flex flex-col gap-10">
      {/* Filters in one row above the figures. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Period" className="flex flex-wrap gap-1">
          {(Object.keys(REPORT_RANGES) as ReportRange[]).map((key) => (
            <Link
              key={key}
              href={`/admin/reports?range=${key}`}
              aria-current={key === range ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                key === range
                  ? "border-brand-600 bg-brand-50 font-medium dark:bg-brand-950"
                  : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900",
              )}
            >
              {REPORT_RANGES[key].label}
            </Link>
          ))}
        </nav>
        <LinkButton href={`/admin/reports/export?range=${range}`} variant="secondary" size="sm" prefetch={false}>
          Download CSV
        </LinkButton>
      </div>
      <p className="-mt-6 text-sm text-zinc-500">
        Paid orders from {formatDateTime(from)} to {formatDateTime(to)} (Philippine time). Delivery fees are shown
        separately and not counted as product sales.
      </p>

      {coverage !== null && coverage < 0.999 && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Costs are missing for {formatPercent(1 - coverage)} of sales, so profit, margin and ROI only cover the other{" "}
          {formatPercent(coverage)}.{" "}
          <Link href="/admin/costs" className="font-medium underline">
            Add costs
          </Link>{" "}
          (new orders save the cost at the time of sale).
        </p>
      )}

      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Net sales" value={s.netSales.format()} note={`${s.orders} paid orders · ${s.units} units`} />
        <StatTile label="Gross profit" value={coverage ? s.grossProfit.format() : "—"} note={`Cost of goods ${s.cogs.format()}`} />
        <StatTile label="Margin" value={formatPercent(s.margin)} note="Profit ÷ net sales" />
        <StatTile label="ROI" value={formatPercent(s.roi)} note="Profit ÷ cost of goods" />
        <StatTile label="Cash collected" value={s.cashCollected.format()} note="Everything customers paid" />
        <StatTile label="Average order" value={s.averageOrder.format()} />
        <StatTile label="Discounts given" value={s.discounts.format()} />
        <StatTile label="Delivery fees collected" value={s.deliveryFees.format()} />
      </section>

      <Card>
        <SalesChart series={series} />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Orders placed in this period</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Placed" value={String(sales.funnel.placed)} />
          <StatTile label="Paid" value={String(sales.funnel.paid)} />
          <StatTile label="Still waiting" value={String(sales.funnel.waiting)} />
          <StatTile label="Expired unpaid" value={String(sales.funnel.expired)} />
          <StatTile label="Cancelled" value={String(sales.funnel.cancelled)} />
          <StatTile label="Payment rate" value={formatPercent(sales.funnel.paymentRate)} note="Paid ÷ (paid + expired + cancelled)" />
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="text-xl font-semibold">What sold</h2>
        <BreakdownTable title="Top products" rows={sales.topProducts} limit={10} />
        <div className="grid gap-8 xl:grid-cols-2">
          <BreakdownTable title="By category" rows={sales.byCategory} />
          <BreakdownTable title="New vs used" rows={sales.byCondition} />
          <BreakdownTable title="By payment method" rows={sales.byPayment} />
          <BreakdownTable title="Pickup vs delivery" rows={sales.byFulfillment} />
        </div>
        {sales.promos.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">Promo codes used</h3>
            <ul className="text-sm">
              {sales.promos.map((p) => (
                <li key={p.code} className="flex justify-between border-b border-zinc-100 py-1 tabular-nums dark:border-zinc-900">
                  <span>{p.code}</span>
                  <span>
                    {p.orders} orders · {p.discount.format()} off
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Stock on hand (now)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Units in stock" value={String(inventory.units)} note={`${inventory.products} products`} />
          <StatTile
            label="Value at cost"
            value={inventory.valueAtCost.format()}
            note={inventory.missingCost ? `${inventory.missingCost} products have no cost yet` : "Money tied up in stock"}
          />
          <StatTile label="Value at list price" value={inventory.valueAtPrice.format()} />
          <StatTile label="Potential profit" value={inventory.potentialProfit.format()} note="If all sells at list price" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">How long stock has been listed</h3>
            <table className="w-full text-sm tabular-nums">
              <tbody>
                {inventory.aging.map((bucket) => (
                  <tr key={bucket.label} className="border-b border-zinc-100 dark:border-zinc-900">
                    <th scope="row" className="py-2 text-left font-normal">{bucket.label}</th>
                    <td className="py-2 text-right">{bucket.units} units</td>
                    <td className="py-2 text-right">{bucket.value.format()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">Slowest to sell</h3>
            {inventory.slowest.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing in stock with a listing date yet.</p>
            ) : (
              <ul className="text-sm">
                {inventory.slowest.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-4 border-b border-zinc-100 py-1 tabular-nums dark:border-zinc-900">
                    <span>
                      {item.name} <span className="text-zinc-500">({item.condition})</span>
                    </span>
                    <span className="shrink-0">
                      {item.days} days · {item.value.format()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
