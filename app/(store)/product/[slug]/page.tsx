import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { ProductPrice } from "@/components/currency/product-price";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductImage } from "@/components/product/product-image";
import { SpecTable } from "@/components/product/spec-table";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge/badge";
import { getAllProducts, loadCatalog } from "@/lib/data/catalog";
import { Bundle } from "@/lib/domain/bundle";
import { MAX_QUANTITY_PER_LINE } from "@/lib/domain/cart";
import type { Product } from "@/lib/domain/product";
import { productMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const LOW_STOCK = 3;

export async function generateStaticParams() {
  const products = await getAllProducts();
  // Cache Components needs at least one param at build time; this one 404s.
  if (products.length === 0) return [{ slug: "__placeholder__" }];
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = (await loadCatalog()).find((await params).slug);
  return product ? productMetadata(product) : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const catalog = await loadCatalog();
  const product = catalog.find(slug);
  if (!product) notFound();

  const companions = product.companionsIn(catalog).slice(0, 8);
  const [cover, ...gallery] = product.images;

  return (
    <>
      <Breadcrumbs
        crumbs={[
          { name: product.category.label, href: `/shop/${product.category.slug}` },
          { name: product.name, href: product.path },
        ]}
      />

      <article className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <ProductImage image={cover} sizes="(min-width: 1024px) 50vw, 100vw" priority />
          {gallery.length > 0 && (
            <ul className="grid grid-cols-4 gap-3">
              {gallery.map((image) => (
                <li key={image.url}>
                  <ProductImage image={image} sizes="12vw" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-zinc-500">{product.brand}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          </div>

          <ProductPrice size="lg" {...product.displayPrices()} />
          <div className="flex flex-wrap gap-2">
            <Badge tone={product.isUsed ? "accent" : "neutral"}>{product.conditionLabel}</Badge>
            <StockBadge product={product} />
          </div>
          <AddToCartForm
            productId={product.id}
            maxQuantity={Math.min(product.stock, MAX_QUANTITY_PER_LINE)}
          />

          <p className="text-zinc-700 dark:text-zinc-300">{product.description}</p>

          {product.conditionNotes && (
            <section aria-labelledby="condition-heading" className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950">
              <h2 id="condition-heading" className="mb-1 font-semibold">
                Condition: {product.conditionLabel}
              </h2>
              <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">{product.conditionNotes}</p>
            </section>
          )}

          {product instanceof Bundle && <BundleContents bundle={product} />}

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="mb-2 font-semibold">
              Specifications
            </h2>
            <SpecTable specs={product.getSpecs()} />
          </section>
        </div>
      </article>

      {companions.length > 0 && (
        <section aria-labelledby="companions-heading" className="flex flex-col gap-4">
          <h2 id="companions-heading" className="text-xl font-semibold">
            {companionsTitle(product)}
          </h2>
          <ProductGrid products={companions} />
        </section>
      )}

      <JsonLd data={product.toJsonLd(site.url)} />
    </>
  );
}

function companionsTitle(product: Product) {
  return product.type === "camera" ? "Lenses and accessories that fit" : "Works with these cameras";
}

function StockBadge({ product }: { product: Product }) {
  const { stock } = product;
  if (stock <= 0) return <Badge tone="danger">Out of stock</Badge>;
  if (stock === 1 && product.isUsed) return <Badge tone="warning">One of a kind</Badge>;
  if (stock <= LOW_STOCK) return <Badge tone="warning">Only {stock} left</Badge>;
  return <Badge tone="success">In stock</Badge>;
}

function BundleContents({ bundle }: { bundle: Bundle }) {
  return (
    <section aria-labelledby="kit-heading" className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
      <h2 id="kit-heading" className="mb-2 font-semibold">
        What&apos;s in the kit
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {bundle.items.map((item) => (
          <li key={item.product.id}>
            {item.quantity}×{" "}
            <Link href={item.product.path} className="underline-offset-4 hover:underline">
              {item.product.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Bought separately: {bundle.itemsTotal().format()}. You save {bundle.savings().format()}.
      </p>
    </section>
  );
}
