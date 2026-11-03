import Link from "next/link";
import { FaqList } from "@/components/content/faq-list";
import { ProductGrid } from "@/components/product/product-grid";
import { Card } from "@/components/ui/card/card";
import { LinkButton } from "@/components/ui/button/link-button";
import { loadCatalog } from "@/lib/data/catalog";
import { getFaqs } from "@/lib/data/content";
import { CATEGORIES } from "@/lib/domain/categories";
import { site } from "@/lib/site";

export default async function Home() {
  const [catalog, faqs] = await Promise.all([loadCatalog(), getFaqs()]);
  const kits = catalog.ofType("bundle").slice(0, 4);
  const cameras = catalog.ofType("camera").slice(0, 8);

  return (
    <>
      <section className="flex flex-col items-start gap-5 py-8">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          New and vintage cameras, ready to shoot.
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">{site.description}</p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/shop" size="lg">
            Shop all gear
          </LinkButton>
          <LinkButton href={`/shop/${CATEGORIES.bundle.slug}`} variant="secondary" size="lg">
            See kits
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="flex flex-col gap-4">
        <h2 id="categories-heading" className="text-xl font-semibold">
          Shop by category
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(CATEGORIES).map((category) => (
            <li key={category.slug} className="flex">
              <Card interactive className="relative flex w-full flex-col gap-1">
                <Link
                  href={`/shop/${category.slug}`}
                  className="font-medium after:absolute after:inset-0"
                >
                  {category.label}
                </Link>
                <p className="text-sm text-zinc-500">{category.description}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {catalog.ofType(category.type).length} products
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {kits.length > 0 && (
        <ProductSection title="Kits that save you money" href={`/shop/${CATEGORIES.bundle.slug}`}>
          <ProductGrid products={kits} />
        </ProductSection>
      )}

      <ProductSection title="Cameras" href={`/shop/${CATEGORIES.camera.slug}`}>
        <ProductGrid products={cameras} />
      </ProductSection>

      <FaqList faqs={faqs} />
    </>
  );
}

function ProductSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
          See all
        </Link>
      </div>
      {children}
    </section>
  );
}
