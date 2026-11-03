import { describe, expect, it } from "vitest";
import { productFromDTO } from "@/lib/domain/product-factory";
import { sanityToDTO, type SanityProduct } from "./sanity-mapper";

const empty = {
  brand: null,
  description: null,
  images: null,
  prices: null,
  stock: null,
  condition: null,
  conditionNotes: null,
  medium: null,
  mount: null,
  sensor: null,
  megapixels: null,
  video: null,
  filmFormat: null,
  style: null,
  focalLength: null,
  maxAperture: null,
  stabilized: null,
  kind: null,
  compatibleMounts: null,
  discountPercent: null,
} satisfies Partial<SanityProduct>;

const lens: SanityProduct = {
  ...empty,
  _id: "lens-1",
  type: "lens",
  slug: "sony-fe-50mm",
  name: "Sony FE 50mm f/1.8",
  brand: "Sony",
  images: [{ url: "https://cdn.sanity.io/x.jpg", alt: null }],
  prices: { PHP: 14999.5, USD: null },
  stock: 3,
  mount: "sony-e",
  focalLength: { min: 50, max: 50 },
  maxAperture: 1.8,
};

describe("sanityToDTO", () => {
  it("converts typed prices to centavos and drops empty currencies", () => {
    expect(sanityToDTO(lens)).toMatchObject({ type: "lens", prices: { PHP: 1_499_950 } });
    expect(sanityToDTO(lens)).not.toHaveProperty("prices.USD");
  });

  it("falls back to the product name for missing alt text", () => {
    expect(sanityToDTO(lens).images[0].alt).toBe("Sony FE 50mm f/1.8");
  });

  it("maps bundles with their items, skipping deleted products", () => {
    const dto = sanityToDTO({
      ...empty,
      _id: "kit-1",
      type: "bundle",
      slug: "kit",
      name: "Kit",
      discountPercent: 10,
      items: [
        { quantity: 2, product: lens },
        { quantity: 1, product: null },
      ],
    });

    const kit = productFromDTO(dto);
    expect(kit.price().format()).toBe("₱26,999.10"); // 2 × 14,999.50 − 10%
    expect(kit.stock).toBe(1); // 3 lenses / 2 per kit
  });
});

describe("sanityToDTO: condition and film cameras", () => {
  const camera: SanityProduct = {
    ...empty,
    _id: "cam-1",
    type: "camera",
    slug: "canon-ae-1",
    name: "Canon AE-1",
    prices: { PHP: 18500 },
    stock: 1,
    medium: "film",
    mount: "canon-fd",
    filmFormat: "35mm",
    style: "slr",
    condition: "excellent",
    conditionNotes: "New light seals.",
  };

  it("maps film cameras to FilmCamera with their condition", () => {
    const product = productFromDTO(sanityToDTO(camera));
    expect(product.constructor.name).toBe("FilmCamera");
    expect(product.conditionLabel).toBe("Used – Excellent");
    expect(product.conditionNotes).toBe("New light seals.");
    expect(product.getSpecs()).toContainEqual({ label: "Film format", value: "35mm" });
  });

  it("defaults to new and drops condition notes on new items", () => {
    const dto = sanityToDTO({ ...camera, medium: "digital", sensor: "full-frame", condition: null });
    expect(dto).toMatchObject({ condition: "new", medium: "digital" });
    expect(dto).not.toHaveProperty("conditionNotes");
  });
});
