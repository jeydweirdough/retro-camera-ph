import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogSkeleton, CatalogView } from "@/components/catalog/catalog-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
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
      <Breadcrumbs
        crumbs={[
          { name: "Shop", href: "/shop" },
          { name: category.label, href: path },
        ]}
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{category.label}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{category.description}</p>
      </div>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView searchParams={searchParams} path={path} type={category.type} />
      </Suspense>
    </>
  );
}
