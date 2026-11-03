import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton, CatalogView } from "@/components/catalog/catalog-view";
import { ShopHeader } from "@/components/catalog/shop-header";

export const metadata: Metadata = {
  title: "Shop all camera gear",
  description: "Browse cameras, lenses, accessories and kits. Filter by camera mount and brand.",
  // Filtered URLs (?brand=…) all point search engines at the main page.
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <ShopHeader
        title="Shop all"
        intro="New and vintage cameras, lenses and accessories. Every used piece is checked and graded before it reaches you."
        crumbs={[{ name: "Shop", href: "/shop" }]}
      />
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView searchParams={searchParams} path="/shop" />
      </Suspense>
    </>
  );
}
