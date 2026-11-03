import type { CsvRow } from "./csv";
import { CAMERA_MEDIA } from "./domain/camera";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "./domain/money";
import {
  CONDITIONS,
  FILM_CAMERA_STYLES,
  FILM_FORMATS,
  LENS_MOUNTS,
  MOUNTS,
  SENSORS,
} from "./domain/specs";

/**
 * Catalog CSV for the Studio's Import / Export tool. Works on Sanity
 * documents as stored (prices in pesos, not centavos). Bundles aren't
 * included: their items are references, edited in the Studio.
 */

export const CSV_TYPES = ["camera", "lens", "accessory"] as const;
export type CsvType = (typeof CSV_TYPES)[number];

const CURRENCY_KEYS = Object.keys(CURRENCIES) as Currency[];
const priceHeader = (currency: Currency) => `price_${currency}`;

export const CATALOG_HEADERS = [
  "id",
  "type",
  "name",
  "slug",
  "brand",
  "description",
  "condition",
  "condition_notes",
  "stock",
  ...CURRENCY_KEYS.map(priceHeader),
  "medium",
  "mount",
  "sensor",
  "megapixels",
  "video",
  "film_format",
  "camera_style",
  "focal_min",
  "focal_max",
  "max_aperture",
  "stabilized",
  "accessory_type",
  "compatible_mounts",
];

/** A product document as the Studio stores it (only the fields the CSV uses). */
export interface SanityProductDoc {
  _id: string;
  _type: string;
  name?: string;
  slug?: { current?: string };
  brand?: string;
  description?: string;
  condition?: string;
  conditionNotes?: string;
  stock?: number;
  prices?: Partial<Record<Currency, number>>;
  medium?: string;
  mount?: string;
  sensor?: string;
  megapixels?: number;
  video?: string;
  filmFormat?: string;
  style?: string;
  focalLength?: { min?: number; max?: number };
  maxAperture?: number;
  stabilized?: boolean;
  kind?: string;
  compatibleMounts?: string[];
}

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

export function docToRow(doc: SanityProductDoc): CsvRow {
  return {
    id: doc._id,
    type: doc._type,
    name: str(doc.name),
    slug: str(doc.slug?.current),
    brand: str(doc.brand),
    description: str(doc.description),
    condition: str(doc.condition ?? "new"),
    condition_notes: str(doc.conditionNotes),
    stock: str(doc.stock),
    ...Object.fromEntries(CURRENCY_KEYS.map((c) => [priceHeader(c), str(doc.prices?.[c])])),
    medium: str(doc.medium),
    mount: str(doc.mount),
    sensor: str(doc.sensor),
    megapixels: str(doc.megapixels),
    video: str(doc.video),
    film_format: str(doc.filmFormat),
    camera_style: str(doc.style),
    focal_min: str(doc.focalLength?.min),
    focal_max: str(doc.focalLength?.max),
    max_aperture: str(doc.maxAperture),
    stabilized: doc._type === "lens" ? (doc.stabilized ? "yes" : "no") : "",
    accessory_type: str(doc.kind),
    compatible_mounts: (doc.compatibleMounts ?? []).join(";"),
  };
}

export type ImportRow =
  | { ok: true; line: number; id: string; type: CsvType; isNew: boolean; set: Record<string, unknown>; unset: string[] }
  | { ok: false; line: number; label: string; errors: string[] };

/** What the importer knows about existing products, to match rows to them. */
export interface ExistingProducts {
  ids: ReadonlySet<string>;
  idBySlug: ReadonlyMap<string, string>;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validates one CSV row and turns it into the fields to save. `line` is the spreadsheet row number. */
export function rowToImport(row: CsvRow, line: number, existing: ExistingProducts): ImportRow {
  const errors: string[] = [];
  const label = row.name || row.slug || `row ${line}`;
  const set: Record<string, unknown> = {};
  const unset: string[] = [];

  const type = row.type as CsvType;
  if (!CSV_TYPES.includes(type)) {
    const hint = row.type === "bundle" ? " (edit bundles in the Studio)" : "";
    return { ok: false, line, label, errors: [`type must be camera, lens or accessory${hint}`] };
  }

  const text = (header: string, field: string, required: boolean) => {
    const value = row[header] ?? "";
    if (value) set[field] = value;
    else if (required) errors.push(`${header} is required`);
    else unset.push(field);
    return value;
  };
  const number = (header: string, opts: { required: boolean; integer?: boolean; min?: number }) => {
    const raw = row[header] ?? "";
    if (!raw) {
      if (opts.required) errors.push(`${header} is required`);
      return undefined;
    }
    const n = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(n) || (opts.integer && !Number.isInteger(n)) || (opts.min !== undefined && n < opts.min)) {
      errors.push(`${header} must be a ${opts.integer ? "whole " : ""}number${opts.min !== undefined ? ` ≥ ${opts.min}` : ""}`);
      return undefined;
    }
    return n;
  };
  const choice = (header: string, field: string, options: Record<string, string>) => {
    const value = row[header] ?? "";
    if (!Object.hasOwn(options, value)) errors.push(`${header} must be one of: ${Object.keys(options).join(", ")}`);
    else set[field] = value;
  };

  text("name", "name", true);
  const slug = (row.slug ?? "").toLowerCase();
  if (!SLUG.test(slug)) errors.push("slug must be lowercase letters, numbers and dashes, e.g. canon-ae-1");
  else set.slug = { _type: "slug", current: slug };
  text("brand", "brand", true);
  text("description", "description", true);

  const condition = row.condition || "new";
  if (!Object.hasOwn(CONDITIONS, condition)) errors.push(`condition must be one of: ${Object.keys(CONDITIONS).join(", ")}`);
  else set.condition = condition;
  text("condition_notes", "conditionNotes", false);

  const stock = number("stock", { required: true, integer: true, min: 0 });
  if (stock !== undefined) set.stock = stock;

  const prices: Partial<Record<Currency, number>> = {};
  for (const currency of CURRENCY_KEYS) {
    const price = number(priceHeader(currency), { required: currency === DEFAULT_CURRENCY, min: 0 });
    if (price !== undefined) prices[currency] = price;
  }
  set.prices = prices;

  if (type === "camera") {
    choice("medium", "medium", CAMERA_MEDIA);
    choice("mount", "mount", MOUNTS);
    if (row.medium === "digital") {
      choice("sensor", "sensor", SENSORS);
      const mp = number("megapixels", { required: true, min: 1 });
      if (mp !== undefined) set.megapixels = mp;
      text("video", "video", true);
    } else if (row.medium === "film") {
      choice("film_format", "filmFormat", FILM_FORMATS);
      choice("camera_style", "style", FILM_CAMERA_STYLES);
    }
  }

  if (type === "lens") {
    choice("mount", "mount", LENS_MOUNTS);
    const min = number("focal_min", { required: true, min: 1 });
    const max = number("focal_max", { required: true, min: 1 });
    if (min !== undefined && max !== undefined) {
      if (max < min) errors.push("focal_max must be at least focal_min");
      else set.focalLength = { min, max };
    }
    const aperture = number("max_aperture", { required: true, min: 0.7 });
    if (aperture !== undefined) set.maxAperture = aperture;
    const stabilized = (row.stabilized ?? "").toLowerCase();
    if (!["yes", "no", "true", "false", ""].includes(stabilized)) errors.push("stabilized must be yes or no");
    set.stabilized = stabilized === "yes" || stabilized === "true";
  }

  if (type === "accessory") {
    text("accessory_type", "kind", true);
    const mounts = (row.compatible_mounts ?? "")
      .split(/[;|]/)
      .map((m) => m.trim())
      .filter(Boolean);
    const unknown = mounts.filter((m) => !Object.hasOwn(MOUNTS, m));
    if (unknown.length) errors.push(`compatible_mounts has unknown mounts: ${unknown.join(", ")}`);
    else set.compatibleMounts = mounts;
  }

  if (errors.length > 0) return { ok: false, line, label, errors };

  // Match by id, then by slug; otherwise it's a new product.
  const id = row.id || existing.idBySlug.get(slug) || `${type}-${slug}`;
  if (existing.idBySlug.has(slug) && existing.idBySlug.get(slug) !== id) {
    return { ok: false, line, label, errors: [`slug "${slug}" already belongs to another product`] };
  }
  return { ok: true, line, id, type, isNew: !existing.ids.has(id), set, unset };
}
