import { describe, expect, it } from "vitest";
import {
  canonAe1,
  canonR6II,
  olympusMju2,
  sampleProducts,
  sdCard128,
  sony50f18,
  sonyA7IV,
  sonyNpFz100,
} from "@/lib/data/sample-repository";
import { Catalog } from "./catalog";
import { parseCatalogQuery } from "./catalog-query";

const catalog = Catalog.fromDTOs(sampleProducts);
const slugs = (products: readonly { slug: string }[]) => products.map((p) => p.slug);

describe("parseCatalogQuery", () => {
  it("reads single and repeated params", () => {
    expect(
      parseCatalogQuery({ type: ["camera", "lens"], brand: "Sony", inStock: "1", sort: "price-asc" }),
    ).toEqual({
      types: ["camera", "lens"],
      brands: ["Sony"],
      mounts: [],
      conditions: [],
      inStock: true,
      sort: "price-asc",
    });
  });

  it("drops values it doesn't know", () => {
    const query = parseCatalogQuery({ type: "spaceship", mount: "nope", sort: "random" });
    expect(query).toMatchObject({ types: [], mounts: [], conditions: [], sort: "featured" });
  });
});

describe("Catalog", () => {
  it("finds products by slug", () => {
    expect(catalog.find(sonyA7IV.slug)?.name).toBe("Sony A7 IV");
    expect(catalog.find("missing")).toBeUndefined();
  });

  it("filters by type and brand together", () => {
    const query = parseCatalogQuery({ type: "lens", brand: "Sony" });
    expect(slugs(catalog.search(query))).toEqual([sony50f18.slug]);
  });

  it("filters by mount without listing universal accessories", () => {
    const query = parseCatalogQuery({ mount: "sony-e" });
    expect(slugs(catalog.search(query))).toEqual([
      sonyA7IV.slug,
      sony50f18.slug,
      sonyNpFz100.slug,
    ]);
  });

  it("sorts by price", () => {
    const cheapestFirst = catalog.search(parseCatalogQuery({ type: "camera", sort: "price-asc" }));
    expect(slugs(cheapestFirst)).toEqual([
      olympusMju2.slug,
      canonAe1.slug,
      sonyA7IV.slug,
      canonR6II.slug,
    ]);
  });

  it("counts facets", () => {
    const { brands, mounts } = catalog.facets();
    // A7 IV, 50mm lens, battery, starter kit
    expect(brands).toContainEqual({ value: "Sony", label: "Sony", count: 4 });
    expect(mounts).toContainEqual({ value: "canon-rf", label: "Canon RF", count: 2 });
  });
});

describe("companionsIn (polymorphism)", () => {
  it("a camera lists lenses and accessories that fit it", () => {
    const camera = catalog.find(sonyA7IV.slug)!;
    expect(slugs(camera.companionsIn(catalog))).toEqual([
      sony50f18.slug,
      sdCard128.slug,
      sonyNpFz100.slug,
    ]);
  });

  it("a lens lists the cameras it fits", () => {
    const lens = catalog.find(sony50f18.slug)!;
    expect(slugs(lens.companionsIn(catalog))).toEqual([sonyA7IV.slug]);
  });
});

describe("condition filter", () => {
  it("shows only used or only new items", () => {
    const used = catalog.search(parseCatalogQuery({ condition: "used" }));
    expect(slugs(used).sort()).toEqual([canonAe1.slug, "canon-fd-50mm-f1-8", olympusMju2.slug].sort());
    expect(catalog.search(parseCatalogQuery({ condition: "new" })).every((p) => !p.isUsed)).toBe(true);
  });

  it("counts new and used items", () => {
    expect(catalog.facets().conditions).toEqual([
      { value: "new", label: "New", count: 7 },
      { value: "used", label: "Used / vintage", count: 3 },
    ]);
  });
});
