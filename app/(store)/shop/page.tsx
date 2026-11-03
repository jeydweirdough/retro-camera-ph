import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton, CatalogView } from "@/components/catalog/catalog-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Shop all camera gear",
  description: "Browse cameras, lenses, accessories and kits. Filter by camera mount and brand.",
  // Filtered URLs (?brand=…) all point search engines at the main page.
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Shop", href: "/shop" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Shop all camera gear</h1>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView searchParams={searchParams} path="/shop" />
      </Suspense>
    </>
  );
}
