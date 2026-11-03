import Link from "next/link";
import { ProductPrice } from "@/components/currency/product-price";
import { Badge } from "@/components/ui/badge/badge";
import { Card } from "@/components/ui/card/card";
import type { Product } from "@/lib/domain/product";
import { ProductImage } from "./product-image";

/** One card for every product type: it only uses what all products share. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card
      interactive
      padding="sm"
      className="relative flex w-full flex-col gap-3 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-600"
    >
      <ProductImage
        image={product.images[0]}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      />

      <div className="flex flex-wrap gap-1.5">
        <Badge>{product.category.label}</Badge>
        {product.isUsed && <Badge tone="accent">{product.conditionLabel}</Badge>}
        {!product.inStock && <Badge tone="danger">Out of stock</Badge>}
      </div>

      <div>
        <p className="text-xs text-zinc-500">{product.brand}</p>
        <h3 className="font-medium leading-snug">
          {/* The stretched link makes the whole card clickable. */}
          <Link href={product.path} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
      </div>

      <ProductPrice className="mt-auto" {...product.displayPrices()} />
    </Card>
  );
}
