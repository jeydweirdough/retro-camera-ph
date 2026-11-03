import { describe, expect, it } from "vitest";
import {
  canonR6II,
  canonRf24105,
  sampleProducts,
  sdCard128,
  sony50f18,
  sonyA7IV,
  sonyNpFz100,
  sonyStarterKit,
} from "@/lib/data/sample-repository";
import { Bundle } from "./bundle";
import { Camera } from "./camera";
import { CompatibilityIndex } from "./compatibility-index";
import { productFromDTO } from "./product-factory";

describe("productFromDTO", () => {
  it("builds the matching class for every type", () => {
    const types = sampleProducts.map((dto) => productFromDTO(dto).constructor.name);
    expect(types).toEqual([
      "DigitalCamera",
      "DigitalCamera",
      "Lens",
      "Lens",
      "Accessory",
      "Accessory",
      "Bundle",
      "FilmCamera",
      "Lens",
      "FilmCamera",
    ]);
  });

  it("round-trips every product through toDTO()", () => {
    for (const dto of sampleProducts) {
      expect(productFromDTO(dto).toDTO()).toEqual(dto);
    }
  });

  it("serializes to plain data for Client Components", () => {
    const camera = productFromDTO(sonyA7IV);
    expect(JSON.parse(JSON.stringify(camera))).toEqual(sonyA7IV);
  });
});

describe("getSpecs (polymorphism)", () => {
  it("each type describes itself", () => {
    expect(productFromDTO(sonyA7IV).getSpecs()).toContainEqual({ label: "Resolution", value: "33 MP" });
    expect(productFromDTO(sony50f18).getSpecs()).toContainEqual({ label: "Type", value: "Prime" });
    expect(productFromDTO(canonRf24105).getSpecs()).toContainEqual({
      label: "Focal length",
      value: "24–105mm",
    });
    expect(productFromDTO(sdCard128).getSpecs()).toContainEqual({
      label: "Compatibility",
      value: "All cameras",
    });
  });
});

describe("Bundle", () => {
  const kit = productFromDTO(sonyStarterKit) as Bundle;

  it("derives its price from its items minus the discount", () => {
    // 139,999 + 14,999 + 2 × 1,999 = 158,996 → 5% off = 151,046.20
    expect(kit.itemsTotal().format()).toBe("₱158,996.00");
    expect(kit.price().format()).toBe("₱151,046.20");
    expect(kit.savings().format()).toBe("₱7,949.80");
  });

  it("is priced only in currencies every item has", () => {
    // $2,499 + $279 + 2 × $39 = $2,856 → 5% off = $2,713.20
    expect(kit.price("USD").format()).toBe("$2,713.20");
    const mixed = new Bundle(
      { ...sonyStarterKit, items: [] },
      [
        { product: productFromDTO(canonR6II), quantity: 1 },
        { product: productFromDTO(canonRf24105), quantity: 1 }, // PHP only
      ],
    );
    expect(mixed.prices.currencies()).toEqual(["PHP"]);
    expect(mixed.price("USD").currency).toBe("PHP");
  });

  it("has only as much stock as its scarcest item allows", () => {
    // camera 4, lens 10, cards 50 / 2 = 25 → 4 kits
    expect(kit.stock).toBe(4);
  });

  it("rejects invalid kits", () => {
    const camera = { product: productFromDTO(sonyA7IV), quantity: 1 };
    expect(() => new Bundle(sonyStarterKit, [])).toThrow(RangeError);
    expect(() => new Bundle(sonyStarterKit, [{ ...camera, quantity: 0 }])).toThrow(RangeError);
    expect(() => new Bundle({ ...sonyStarterKit, discountPercent: 100 }, [camera])).toThrow(RangeError);
  });
});

describe("CompatibilityIndex", () => {
  const index = new CompatibilityIndex(sampleProducts.map(productFromDTO));
  const slugsFor = (camera: Camera) => index.forMount(camera.mount).map((p) => p.slug);

  it("lists lenses and accessories that fit a camera's mount", () => {
    const sony = productFromDTO(sonyA7IV) as Camera;
    expect(slugsFor(sony)).toEqual([sony50f18.slug, sdCard128.slug, sonyNpFz100.slug]);

    const canon = productFromDTO(canonR6II) as Camera;
    expect(slugsFor(canon)).toEqual([canonRf24105.slug, sdCard128.slug]);
  });
});

describe("toJsonLd", () => {
  it("produces schema.org Product data with an Offer", () => {
    const jsonLd = productFromDTO(sonyA7IV).toJsonLd("https://example.com");
    expect(jsonLd).toMatchObject({
      "@type": "Product",
      name: "Sony A7 IV",
      category: "Cameras",
      url: "https://example.com/product/sony-a7-iv",
      offers: {
        price: "139999.00",
        priceCurrency: "PHP",
        availability: "https://schema.org/InStock",
      },
    });
    expect(jsonLd.additionalProperty).toContainEqual({
      "@type": "PropertyValue",
      name: "Mount",
      value: "Sony E",
    });
  });
});
