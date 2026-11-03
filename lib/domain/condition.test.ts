import { describe, expect, it } from "vitest";
import {
  canonAe1,
  canonFd50,
  olympusMju2,
  sampleProducts,
  sdCard128,
  sonyA7IV,
  sonyStarterKit,
} from "@/lib/data/sample-repository";
import { Catalog } from "./catalog";
import { productFromDTO } from "./product-factory";
import { worstCondition } from "./specs";

const catalog = Catalog.fromDTOs(sampleProducts);
const slugsOf = (slug: string) => catalog.find(slug)!.companionsIn(catalog).map((p) => p.slug);

describe("condition", () => {
  it("labels new and used items", () => {
    expect(productFromDTO(sonyA7IV).conditionLabel).toBe("New");
    expect(productFromDTO(canonFd50).conditionLabel).toBe("Used – Good");
  });

  it("marks used items as UsedCondition for search engines", () => {
    const jsonLd = productFromDTO(canonAe1).toJsonLd("https://example.com");
    expect(jsonLd.offers.itemCondition).toBe("https://schema.org/UsedCondition");
  });

  it("gives a bundle its most worn item's condition", () => {
    expect(worstCondition(["new", "excellent", "good", "mint"])).toBe("good");
    expect(worstCondition([])).toBe("new");

    const vintageKit = productFromDTO({
      ...sonyStarterKit,
      items: [
        { product: canonAe1, quantity: 1 },
        { product: canonFd50, quantity: 1 },
      ],
    });
    expect(vintageKit.conditionLabel).toBe("Used – Good");
  });
});

describe("vintage compatibility", () => {
  it("pairs film SLRs and their vintage lenses both ways", () => {
    expect(slugsOf(canonAe1.slug)).toContain(canonFd50.slug);
    expect(slugsOf(canonFd50.slug)).toEqual([canonAe1.slug]);
  });

  it("a fixed-lens camera only pairs with universal accessories", () => {
    expect(slugsOf(olympusMju2.slug)).toEqual([sdCard128.slug]);
  });
});
