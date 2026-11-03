import { cn } from "@/lib/cn";
import type { SeriesPoint } from "@/lib/domain/reports";

/**
 * Net sales over time as columns. One series, so no legend: the caption
 * names it. Each column is focusable and shows its figures on hover or
 * keyboard focus; "Show as table" lists every number.
 *
 * Bar color brand-600 (#cb5937) passes the dataviz palette checks on both the
 * white and the zinc-950 surface, so light and dark mode use the same step.
 */
export function SalesChart({ series }: { series: SeriesPoint[] }) {
  const max = Math.max(0, ...series.map((p) => p.netSales.minor));
  const peak = series.find((p) => p.netSales.minor === max);
  const ticks = [...new Set([0, Math.floor((series.length - 1) / 2), series.length - 1])].map((i) => series[i]);

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-semibold">Net sales over time</figcaption>

      {max === 0 ? (
        <p className="text-sm text-zinc-500">No sales in this period.</p>
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-x-3">
          <div aria-hidden className="flex h-48 flex-col justify-between text-right text-xs text-zinc-500 tabular-nums">
            <span>{peak?.netSales.format()}</span>
            <span>₱0</span>
          </div>
          <div className="relative h-48 border-b border-zinc-300 dark:border-zinc-700">
            <div aria-hidden className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-200 dark:border-zinc-800" />
            <ul className="absolute inset-0 flex items-end gap-0.5" aria-label="Net sales per period">
              {series.map((point, index) => (
                <li key={point.start} className="group relative flex h-full flex-1 items-end justify-center">
                  {/* The hit target is the whole column, not just the (possibly tiny) bar. */}
                  <span
                    tabIndex={0}
                    aria-label={`${point.label}: ${point.netSales.format()} net sales, ${point.units} units`}
                    className="flex h-full w-full items-end justify-center rounded focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    <span
                      className="block w-full max-w-6 rounded-t bg-brand-600 group-hover:bg-brand-700 group-focus-within:bg-brand-700"
                      style={{ height: `${(point.netSales.minor / max) * 100}%` }}
                    />
                  </span>
                  <span
                    role="tooltip"
                    // Inside the plot and aligned toward its middle, so it never spills off the chart.
                    className={cn(
                      "pointer-events-none absolute top-1 z-10 hidden whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white shadow group-hover:block group-focus-within:block dark:bg-zinc-100 dark:text-zinc-900",
                      index < series.length / 2 ? "left-0" : "right-0",
                    )}
                  >
                    <span className="block font-medium">{point.label}</span>
                    <span className="block tabular-nums">Net sales {point.netSales.format()}</span>
                    <span className="block tabular-nums">
                      Profit {point.grossProfit.format()} · {point.units} units
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div />
          <div aria-hidden className="mt-1 flex justify-between text-xs text-zinc-500">
            {ticks.map((p) => (
              <span key={p.start}>{p.label}</span>
            ))}
          </div>
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400">Show as table</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead className="text-left text-zinc-500">
            <tr>
              <th scope="col" className="py-1 font-normal">Period</th>
              <th scope="col" className="py-1 text-right font-normal">Net sales</th>
              <th scope="col" className="py-1 text-right font-normal">Profit</th>
              <th scope="col" className="py-1 text-right font-normal">Units</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.start} className="border-t border-zinc-100 dark:border-zinc-900">
                <th scope="row" className="py-1 text-left font-normal">
                  {p.label}
                </th>
                <td className="py-1 text-right">{p.netSales.format()}</td>
                <td className="py-1 text-right">{p.grossProfit.format()}</td>
                <td className="py-1 text-right">{p.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
