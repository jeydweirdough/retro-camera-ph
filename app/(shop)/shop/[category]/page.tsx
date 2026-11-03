import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogSkeleton, CatalogView } from "@/components/catalog/catalog-view";
import { ShopHeader } from "@/components/catalog/shop-header";
import { CATEGORIES, categoryBySlug } from "@/lib/domain/categories";

export function generateStaticParams() {
  return Object.values(CATEGORIES).map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = categoryBySlug((await params).category);
  if (!category) return {};

  const path = `/shop/${category.slug}`;
  return {
    title: category.label,
    description: category.description,
    alternates: { canonical: path },
    openGraph: { title: category.label, description: category.description, url: path },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  const category = categoryBySlug((await params).category);
  if (!category) notFound();

  const path = `/shop/${category.slug}`;

  return (
    <>
      <ShopHeader
        title={category.label}
        intro={category.description}
        active={category.type}
        crumbs={[
          { name: "Shop", href: "/shop" },
          { name: category.label, href: path },
        ]}
      />
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView searchParams={searchParams} path={path} type={category.type} />
      </Suspense>
    </>
  );
}
