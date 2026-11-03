import type { ProductDTO, ProductFields, StandaloneFields } from "@/lib/domain/dto";
import { CURRENCIES, Money, type Currency } from "@/lib/domain/money";
import type { PriceMap } from "@/lib/domain/price-list";
import type {
  Condition,
  FilmCameraStyle,
  FilmFormat,
  LensMount,
  Mount,
  Sensor,
} from "@/lib/domain/specs";

/** GROQ projection shared by products and bundle items, so both map the same way. */
export const PRODUCT_PROJECTION = `
  _id,
  "updatedAt": _updatedAt,
  "listedAt": _createdAt,
  "type": _type,
  "slug": slug.current,
  name,
  brand,
  description,
  "images": images[]{ "url": asset->url, alt },
  prices,
  stock,
  condition,
  conditionNotes,
  medium,
  mount,
  sensor,
  megapixels,
  video,
  filmFormat,
  style,
  focalLength,
  maxAperture,
  stabilized,
  kind,
  compatibleMounts,
  discountPercent
`;

/** What the projection returns. Sanity can return null for any empty field. */
export interface SanityProduct {
  _id: string;
  updatedAt?: string;
  listedAt?: string;
  type: ProductDTO["type"];
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  images: { url: string; alt: string | null }[] | null;
  prices: Partial<Record<Currency, number | null>> | null;
  stock: number | null;
  condition: Condition | null;
  conditionNotes: string | null;
  medium: "digital" | "film" | null;
  mount: Mount | null;
  sensor: Sensor | null;
  megapixels: number | null;
  video: string | null;
  filmFormat: FilmFormat | null;
  style: FilmCameraStyle | null;
  focalLength: { min: number; max: number } | null;
  maxAperture: number | null;
  stabilized: boolean | null;
  kind: string | null;
  compatibleMounts: Mount[] | null;
  discountPercent: number | null;
  items?: { quantity: number | null; product: SanityProduct | null }[] | null;
}

/** Sanity stores ₱139,999.00 as 139999; the domain uses centavos. */
function toPriceMap(prices: SanityProduct["prices"]): PriceMap {
  const map: Partial<Record<Currency, number>> = {};
  for (const currency of Object.keys(CURRENCIES) as Currency[]) {
    const amount = prices?.[currency];
    if (typeof amount === "number") map[currency] = Money.fromMajor(amount, currency).minor;
  }
  return map as PriceMap;
}

export function sanityToDTO(raw: SanityProduct): ProductDTO {
  const base: ProductFields = {
    id: raw._id,
    slug: raw.slug,
    name: raw.name,
    brand: raw.brand ?? "",
    description: raw.description ?? "",
    images: (raw.images ?? []).map((image) => ({ url: image.url, alt: image.alt || raw.name })),
    ...(raw.updatedAt && { updatedAt: raw.updatedAt }),
    ...(raw.listedAt && { listedAt: raw.listedAt }),
  };

  if (raw.type === "bundle") {
    return {
      ...base,
      type: "bundle",
      discountPercent: raw.discountPercent ?? 0,
      items: (raw.items ?? []).flatMap((item) =>
        item.product ? [{ product: sanityToDTO(item.product), quantity: item.quantity ?? 1 }] : [],
      ),
    };
  }

  const condition = raw.condition ?? "new";
  const standalone: StandaloneFields = {
    ...base,
    prices: toPriceMap(raw.prices),
    stock: raw.stock ?? 0,
    condition,
    // Notes only make sense for used items.
    ...(condition !== "new" && raw.conditionNotes && { conditionNotes: raw.conditionNotes }),
  };

  switch (raw.type) {
    case "camera": {
      const camera = { ...standalone, type: "camera" as const, mount: raw.mount ?? "fixed" };
      return raw.medium === "film"
        ? {
            ...camera,
            medium: "film",
            filmFormat: raw.filmFormat ?? "35mm",
            style: raw.style ?? "slr",
          }
        : {
            ...camera,
            medium: "digital",
            sensor: raw.sensor!,
            megapixels: raw.megapixels ?? 0,
            video: raw.video ?? "",
          };
    }
    case "lens":
      return {
        ...standalone,
        type: "lens",
        // The Studio only offers lens mounts here, never "fixed".
        mount: raw.mount as LensMount,
        focalLength: raw.focalLength ?? { min: 0, max: 0 },
        maxAperture: raw.maxAperture ?? 0,
        stabilized: raw.stabilized ?? false,
      };
    case "accessory":
      return {
        ...standalone,
        type: "accessory",
        kind: raw.kind ?? "",
        compatibleMounts: raw.compatibleMounts ?? [],
      };
  }
}
