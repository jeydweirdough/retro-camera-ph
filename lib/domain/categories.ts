import type { ProductType } from "./dto";

export interface Category {
  type: ProductType;
  slug: string;
  label: string;
  description: string;
}

/** One entry per product type: drives URLs, navigation, breadcrumbs and SEO. */
export const CATEGORIES: Record<ProductType, Category> = {
  camera: {
    type: "camera",
    slug: "cameras",
    label: "Cameras",
    description: "Digital and film cameras, new and vintage.",
  },
  lens: {
    type: "lens",
    slug: "lenses",
    label: "Lenses",
    description: "Modern and vintage lenses, filterable by camera mount.",
  },
  accessory: {
    type: "accessory",
    slug: "accessories",
    label: "Accessories",
    description: "Film, memory cards, batteries, bags and other camera gear.",
  },
  bundle: {
    type: "bundle",
    slug: "kits",
    label: "Bundles & Kits",
    description: "Camera kits that cost less than buying each item separately.",
  },
};

const bySlug = new Map(Object.values(CATEGORIES).map((c) => [c.slug, c]));

export function categoryBySlug(slug: string): Category | undefined {
  return bySlug.get(slug);
}
