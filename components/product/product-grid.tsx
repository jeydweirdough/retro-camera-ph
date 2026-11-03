import type { ReactNode } from "react";
import type { Product } from "@/lib/domain/product";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  empty = "No products yet. Check back soon.",
}: {
  products: readonly Product[];
  empty?: ReactNode;
}) {
  if (products.length === 0) {
    return <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">{empty}</p>;
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
