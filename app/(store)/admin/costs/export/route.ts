import { currentAdmin } from "@/lib/auth/session";
import { getCostMap } from "@/lib/costs/repository";
import { toCsv } from "@/lib/csv";
import { csvResponse, notFoundResponse } from "@/lib/csv-response";
import { loadCatalog } from "@/lib/data/catalog";
import { Money } from "@/lib/domain/money";

const HEADERS = ["product_id", "slug", "name", "type", "condition", "stock", "price_PHP", "cost_PHP"];

export async function GET() {
  if (!(await currentAdmin())) return notFoundResponse();

  const products = (await loadCatalog()).products.filter((p) => p.type !== "bundle");
  const costs = await getCostMap(products.map((p) => p.id));
  const rows = products.map((p) => ({
    product_id: p.id,
    slug: p.slug,
    name: p.name,
    type: p.type,
    condition: p.conditionLabel,
    stock: p.stock,
    price_PHP: p.price().toDecimalString(),
    cost_PHP: costs.has(p.id) ? Money.ofMinor(costs.get(p.id)!).toDecimalString() : "",
  }));

  return csvResponse(`retro-camera-costs-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(HEADERS, rows));
}
