import type { MetadataRoute } from "next";
import { loadCatalog } from "@/lib/data/catalog";
import { CATEGORIES } from "@/lib/domain/categories";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await loadCatalog();

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.9 },
    ...Object.values(CATEGORIES).map((category) => ({
      url: absoluteUrl(`/shop/${category.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...catalog.products.map((product) => ({
      url: absoluteUrl(product.path),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: product.images.map((image) => image.url),
    })),
  ];
}
