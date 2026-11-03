import type { Breakdown } from "@/lib/domain/reports";
import { formatPercent } from "@/lib/format";

export interface BreakdownRow extends Breakdown {
  key: string;
  name?: string;
}

/** Sales, profit, margin and ROI per group. One table for every breakdown. */
export function BreakdownTable({ title, rows, limit }: { title: string; rows: BreakdownRow[]; limit?: number }) {
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-semibold">{title}</h3>
      {shown.length === 0 ? (
        <p className="text-sm text-zinc-500">No sales in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="text-left text-zinc-500">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th scope="col" className="py-2 pr-3 font-normal">Name</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Units</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Net sales</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Profit</th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">Margin</th>
                <th scope="col" className="py-2 text-right font-normal">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums dark:divide-zinc-900">
              {shown.map((row) => {
                // Profit only counts lines with a known cost; mark when some are missing.
                const noCost = row.costCoverage === 0;
                const partial = !noCost && row.costCoverage !== null && row.costCoverage < 0.999;
                return (
                  <tr key={row.key}>
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      {row.name ?? row.key}
                    </th>
                    <td className="py-2 pr-3 text-right">{row.units}</td>
                    <td className="py-2 pr-3 text-right">{row.netSales.format()}</td>
                    <td className="py-2 pr-3 text-right">
                      {noCost ? "Cost missing" : row.grossProfit.format()}
                      {partial && <span title="Some items have no cost yet"> *</span>}
                    </td>
                    <td className="py-2 pr-3 text-right">{formatPercent(row.margin)}</td>
                    <td className="py-2 text-right">{formatPercent(row.roi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
