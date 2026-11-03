import { describe, expect, it } from "vitest";
import { CATALOG_HEADERS, docToRow, rowToImport, type ExistingProducts } from "./catalog-csv";
import { parseCsv, toCsv } from "./csv";

const none: ExistingProducts = { ids: new Set(), idBySlug: new Map() };

const filmCamera = {
  type: "camera",
  name: "Canon AE-1 Program",
  slug: "canon-ae-1-program",
  brand: "Canon",
  description: "Classic 35mm SLR.",
  condition: "excellent",
  condition_notes: "New light seals.",
  stock: "1",
  price_PHP: "18,500",
  medium: "film",
  mount: "canon-fd",
  film_format: "35mm",
  camera_style: "slr",
};

describe("catalog CSV import", () => {
  it("turns a valid row into Sanity fields, prices in pesos", () => {
    const result = rowToImport(filmCamera, 2, none);
    expect(result).toMatchObject({
      ok: true,
      id: "camera-canon-ae-1-program",
      isNew: true,
      set: {
        name: "Canon AE-1 Program",
        slug: { _type: "slug", current: "canon-ae-1-program" },
        condition: "excellent",
        stock: 1,
        prices: { PHP: 18500 },
        medium: "film",
        filmFormat: "35mm",
        style: "slr",
      },
    });
  });

  it("updates an existing product matched by slug", () => {
    const existing = { ids: new Set(["cam-1"]), idBySlug: new Map([["canon-ae-1-program", "cam-1"]]) };
    expect(rowToImport(filmCamera, 2, existing)).toMatchObject({ ok: true, id: "cam-1", isNew: false });
  });

  it("lists every problem in a row in plain language", () => {
    const result = rowToImport(
      { ...filmCamera, slug: "Canon AE1!", stock: "1.5", price_PHP: "", mount: "nikon-q", film_format: "" },
      7,
      none,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBe(7);
      expect(result.errors).toEqual([
        "slug must be lowercase letters, numbers and dashes, e.g. canon-ae-1",
        "stock must be a whole number ≥ 0",
        "price_PHP is required",
        expect.stringContaining("mount must be one of"),
        expect.stringContaining("film_format must be one of"),
      ]);
    }
  });

  it("refuses bundles and points to the Studio", () => {
    const result = rowToImport({ ...filmCamera, type: "bundle" }, 3, none);
    expect(result).toMatchObject({ ok: false, errors: ["type must be camera, lens or accessory (edit bundles in the Studio)"] });
  });

  it("won't let a new row take another product's slug", () => {
    const existing = { ids: new Set(["cam-1"]), idBySlug: new Map([["canon-ae-1-program", "cam-1"]]) };
    expect(rowToImport({ ...filmCamera, id: "cam-2" }, 2, existing)).toMatchObject({ ok: false });
  });

  it("checks lenses and accessories with their own rules", () => {
    const lens = rowToImport(
      { type: "lens", name: "FD 50", slug: "fd-50", brand: "Canon", description: "x", stock: "1", price_PHP: "3500", mount: "fixed", focal_min: "50", focal_max: "35", max_aperture: "1.8" },
      2,
      none,
    );
    expect(!lens.ok && lens.errors).toEqual([expect.stringContaining("mount must be one of"), "focal_max must be at least focal_min"]);

    const accessory = rowToImport(
      { type: "accessory", name: "Battery", slug: "np-fz100", brand: "Sony", description: "x", stock: "5", price_PHP: "4499", accessory_type: "Batteries", compatible_mounts: "sony-e; canon-xx" },
      2,
      none,
    );
    expect(!accessory.ok && accessory.errors).toEqual(["compatible_mounts has unknown mounts: canon-xx"]);
  });
});

describe("catalog CSV export → import round trip", () => {
  it("re-imports an exported product unchanged", () => {
    const doc = {
      _id: "lens-1",
      _type: "lens",
      name: "Sony FE 50mm f/1.8",
      slug: { current: "sony-fe-50mm" },
      brand: "Sony",
      description: 'Compact prime, "nifty fifty"',
      condition: "new",
      stock: 10,
      prices: { PHP: 14999, USD: 279 },
      mount: "sony-e",
      focalLength: { min: 50, max: 50 },
      maxAperture: 1.8,
      stabilized: false,
    };
    const [row] = parseCsv(toCsv(CATALOG_HEADERS, [docToRow(doc)])).rows;
    const result = rowToImport(row, 2, { ids: new Set(["lens-1"]), idBySlug: new Map([["sony-fe-50mm", "lens-1"]]) });
    expect(result).toMatchObject({
      ok: true,
      id: "lens-1",
      isNew: false,
      set: {
        description: 'Compact prime, "nifty fifty"',
        prices: { PHP: 14999, USD: 279 },
        focalLength: { min: 50, max: 50 },
        maxAperture: 1.8,
        stabilized: false,
      },
    });
  });
});
