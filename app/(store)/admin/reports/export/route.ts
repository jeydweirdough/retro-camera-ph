import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth/session";
import { toCsv } from "@/lib/csv";
import { csvResponse, notFoundResponse } from "@/lib/csv-response";
import type { Breakdown } from "@/lib/domain/reports";
import { parseRange } from "@/lib/domain/reports";
import { loadReports } from "@/lib/reports/load";

const HEADERS = ["section", "name", "units", "net_sales", "cost_of_goods", "gross_profit", "margin_pct", "roi_pct", "cost_coverage_pct"];

const pct = (ratio: number | null) => (ratio === null ? "" : (ratio * 100).toFixed(2));
const row = (section: string, name: string, b: Breakdown) => ({
  section,
  name,
  units: b.units,
  net_sales: b.netSales.toDecimalString(),
  cost_of_goods: b.cogs.toDecimalString(),
  gross_profit: b.grossProfit.toDecimalString(),
  margin_pct: pct(b.margin),
  roi_pct: pct(b.roi),
  cost_coverage_pct: pct(b.costCoverage),
});

/** The report as one spreadsheet: totals, then every breakdown and day. */
export async function GET(request: NextRequest) {
  if (!(await currentAdmin())) return notFoundResponse();

  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const { sales, series } = await loadReports(range);

  const rows = [
    row("total", "All paid orders", sales.summary),
    ...sales.topProducts.map((p) => row("product", p.name, p)),
    ...sales.byCategory.map((c) => row("category", c.key, c)),
    ...sales.byCondition.map((c) => row("condition", c.key, c)),
    ...sales.byPayment.map((c) => row("payment_method", c.key, c)),
    ...sales.byFulfillment.map((c) => row("fulfillment", c.key, c)),
    ...series.map((p) => ({
      section: "period",
      name: p.start,
      units: p.units,
      net_sales: p.netSales.toDecimalString(),
      gross_profit: p.grossProfit.toDecimalString(),
    })),
  ];

  return csvResponse(`retro-camera-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(HEADERS, rows));
}
