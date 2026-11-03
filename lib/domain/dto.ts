import type { PriceMap } from "./price-list";
import type {
  Condition,
  FilmCameraStyle,
  FilmFormat,
  LensMount,
  Mount,
  Sensor,
} from "./specs";

/**
 * Plain, serializable product data. This is what repositories return, what
 * `use cache` stores, and what Client Components receive. Domain classes are
 * built from it with `productFromDTO()` and turned back with `toDTO()`.
 */

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductFields {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  images: ProductImage[];
  /** ISO date of the last edit, for sitemaps. */
  updatedAt?: string;
  /** ISO date the product was first added, for inventory aging. */
  listedAt?: string;
}

/** A product sold on its own, with its own price, stock and condition. */
export interface StandaloneFields extends ProductFields {
  prices: PriceMap;
  stock: number;
  condition: Condition;
  /** For used items, e.g. "Light meter works. Minor brassing on top plate." */
  conditionNotes?: string;
}

interface CameraFields extends StandaloneFields {
  type: "camera";
  mount: Mount;
}

export interface DigitalCameraDTO extends CameraFields {
  medium: "digital";
  sensor: Sensor;
  megapixels: number;
  video: string;
}

export interface FilmCameraDTO extends CameraFields {
  medium: "film";
  filmFormat: FilmFormat;
  style: FilmCameraStyle;
}

export type CameraDTO = DigitalCameraDTO | FilmCameraDTO;

export interface LensDTO extends StandaloneFields {
  type: "lens";
  mount: LensMount;
  focalLength: { min: number; max: number };
  maxAperture: number;
  stabilized: boolean;
}

export interface AccessoryDTO extends StandaloneFields {
  type: "accessory";
  /** e.g. "Memory cards", "Batteries", "Film". */
  kind: string;
  /** Empty means it fits every mount (bags, cards, tripods). */
  compatibleMounts: Mount[];
}

/** A kit of other products. Price, stock and condition come from its items. */
export interface BundleDTO extends ProductFields {
  type: "bundle";
  items: { product: ProductDTO; quantity: number }[];
  discountPercent: number;
}

export type ProductDTO = CameraDTO | LensDTO | AccessoryDTO | BundleDTO;

export type ProductType = ProductDTO["type"];
