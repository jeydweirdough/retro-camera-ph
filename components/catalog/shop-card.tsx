import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ProductPrice } from "@/components/currency/product-price";
import { PlaceholderCamera } from "@/components/home/camera-shot";
import { ArrowIcon } from "@/components/home/ui";
import type { Product } from "@/lib/domain/product";

/** Shop grid card in the home page style: photo on a soft studio backdrop, mono labels. */
export function ShopCard({ product, index }: { product: Product; index: number }) {
  const image = product.images[0];
  return (
    <article
      className="shop-rise group relative flex h-full w-full flex-col rounded-[22px] bg-white p-2 shadow-[0_1px_0_rgb(0_0_0/0.04)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgb(31_22_12/0.45)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-[#ee6a1c]"
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
    >
      <div className="relative aspect-[4/3.5] overflow-hidden rounded-[16px] bg-gradient-to-b from-[#ece8e0] to-[#f8f6f1]">
        <span className="absolute top-3 left-4 z-10 font-mono text-[10px] tracking-[0.2em] text-black/35">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-[#1f160c] text-white transition-[transform,background-color] duration-500 group-hover:rotate-45 group-hover:bg-[#ee6a1c]">
          <ArrowIcon className="size-4" />
        </span>

        <div className="absolute inset-[12%_10%_14%] transition-transform duration-[1000ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] group-hover:scale-110 group-hover:-rotate-3">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
              className="object-contain drop-shadow-[0_24px_24px_rgba(0,0,0,0.25)]"
            />
          ) : (
            <PlaceholderCamera tone="silver" />
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap gap-1.5 font-mono text-[9px] tracking-[0.12em] uppercase">
          {product.isUsed && <span className="rounded-full bg-white/85 px-2.5 py-1 backdrop-blur">{product.conditionLabel}</span>}
          {!product.inStock && <span className="rounded-full bg-[#1f160c] px-2.5 py-1 text-white">Sold out</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3 pt-4 pb-3">
        <p className="font-mono text-[10px] tracking-[0.16em] text-black/45 uppercase">
          {product.brand} · {product.category.label}
        </p>
        <h3 className="text-[1.05rem] leading-snug font-medium tracking-tight">
          {/* The stretched link makes the whole card clickable. */}
          <Link href={product.path} className="after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-black/15 pt-3">
          <ProductPrice size="md" {...product.displayPrices()} />
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#ee6a1c] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </article>
  );
}
