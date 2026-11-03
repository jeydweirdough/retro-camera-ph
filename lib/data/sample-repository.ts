import type { AccessoryDTO, BundleDTO, CameraDTO, LensDTO, ProductDTO } from "@/lib/domain/dto";
import type { ProductRepository } from "./product-repository";

// Placeholder catalog for development until Sanity is connected.
// Prices are in minor units (centavos / cents) and are not real store prices.

export const sonyA7IV: CameraDTO = {
  type: "camera",
  medium: "digital",
  id: "cam-sony-a7iv",
  slug: "sony-a7-iv",
  name: "Sony A7 IV",
  brand: "Sony",
  description: "33MP full-frame hybrid camera for photo and video.",
  images: [],
  prices: { PHP: 139_999_00, USD: 2_499_00 },
  stock: 4,
  condition: "new",
  mount: "sony-e",
  sensor: "full-frame",
  megapixels: 33,
  video: "4K 60p",
};

export const canonR6II: CameraDTO = {
  type: "camera",
  medium: "digital",
  id: "cam-canon-r6ii",
  slug: "canon-eos-r6-mark-ii",
  name: "Canon EOS R6 Mark II",
  brand: "Canon",
  description: "24MP full-frame camera built for speed and low light.",
  images: [],
  prices: { PHP: 144_999_00, USD: 2_499_00 },
  stock: 2,
  condition: "new",
  mount: "canon-rf",
  sensor: "full-frame",
  megapixels: 24,
  video: "4K 60p",
};

export const sony50f18: LensDTO = {
  type: "lens",
  id: "lens-sony-fe-50-18",
  slug: "sony-fe-50mm-f1-8",
  name: "Sony FE 50mm f/1.8",
  brand: "Sony",
  description: "Compact, affordable prime for portraits and everyday shooting.",
  images: [],
  prices: { PHP: 14_999_00, USD: 279_00 },
  stock: 10,
  condition: "new",
  mount: "sony-e",
  focalLength: { min: 50, max: 50 },
  maxAperture: 1.8,
  stabilized: false,
};

export const canonRf24105: LensDTO = {
  type: "lens",
  id: "lens-canon-rf-24-105-f4l",
  slug: "canon-rf-24-105mm-f4l",
  name: "Canon RF 24-105mm f/4L IS USM",
  brand: "Canon",
  description: "Versatile L-series zoom for travel and events.",
  images: [],
  prices: { PHP: 69_999_00 },
  stock: 3,
  condition: "new",
  mount: "canon-rf",
  focalLength: { min: 24, max: 105 },
  maxAperture: 4,
  stabilized: true,
};

export const sdCard128: AccessoryDTO = {
  type: "accessory",
  id: "acc-sandisk-128",
  slug: "sandisk-extreme-pro-128gb",
  name: "SanDisk Extreme PRO 128GB SD Card",
  brand: "SanDisk",
  description: "Fast UHS-I card for 4K video and burst shooting.",
  images: [],
  prices: { PHP: 1_999_00, USD: 39_00 },
  stock: 50,
  condition: "new",
  kind: "Memory cards",
  compatibleMounts: [],
};

export const sonyNpFz100: AccessoryDTO = {
  type: "accessory",
  id: "acc-sony-np-fz100",
  slug: "sony-np-fz100-battery",
  name: "Sony NP-FZ100 Battery",
  brand: "Sony",
  description: "Rechargeable battery for Sony Alpha full-frame bodies.",
  images: [],
  prices: { PHP: 4_499_00, USD: 79_00 },
  stock: 20,
  condition: "new",
  kind: "Batteries",
  compatibleMounts: ["sony-e"],
};

export const sonyStarterKit: BundleDTO = {
  type: "bundle",
  id: "kit-sony-a7iv-starter",
  slug: "sony-a7-iv-starter-kit",
  name: "Sony A7 IV Starter Kit",
  brand: "Sony",
  description: "A7 IV body, 50mm f/1.8 prime, and two 128GB cards.",
  images: [],
  items: [
    { product: sonyA7IV, quantity: 1 },
    { product: sony50f18, quantity: 1 },
    { product: sdCard128, quantity: 2 },
  ],
  discountPercent: 5,
};

// Vintage, one-of-a-kind items.

export const canonAe1: CameraDTO = {
  type: "camera",
  medium: "film",
  id: "cam-canon-ae1-program",
  slug: "canon-ae-1-program",
  name: "Canon AE-1 Program",
  brand: "Canon",
  description: "Classic 35mm SLR from 1981 with program auto-exposure. A great first film camera.",
  images: [],
  prices: { PHP: 18_500_00 },
  stock: 1,
  condition: "excellent",
  conditionNotes: "Tested with film. Light meter accurate, no shutter squeal. New light seals.",
  mount: "canon-fd",
  filmFormat: "35mm",
  style: "slr",
};

export const canonFd50: LensDTO = {
  type: "lens",
  id: "lens-canon-fd-50-18",
  slug: "canon-fd-50mm-f1-8",
  name: "Canon FD 50mm f/1.8",
  brand: "Canon",
  description: "Sharp, light standard prime for Canon FD film SLRs.",
  images: [],
  prices: { PHP: 3_500_00 },
  stock: 1,
  condition: "good",
  conditionNotes: "Clean glass, no fungus or haze. Light wear on the focus ring.",
  mount: "canon-fd",
  focalLength: { min: 50, max: 50 },
  maxAperture: 1.8,
  stabilized: false,
};

export const olympusMju2: CameraDTO = {
  type: "camera",
  medium: "film",
  id: "cam-olympus-mju-ii",
  slug: "olympus-mju-ii",
  name: "Olympus mju II",
  brand: "Olympus",
  description: "Pocketable 35mm point-and-shoot with a sharp 35mm f/2.8 lens.",
  images: [],
  prices: { PHP: 16_000_00 },
  stock: 1,
  condition: "near-mint",
  mount: "fixed",
  filmFormat: "35mm",
  style: "point-and-shoot",
};

export const sampleProducts: ProductDTO[] = [
  sonyA7IV,
  canonR6II,
  sony50f18,
  canonRf24105,
  sdCard128,
  sonyNpFz100,
  sonyStarterKit,
  canonAe1,
  canonFd50,
  olympusMju2,
];

export class SampleProductRepository implements ProductRepository {
  constructor(private readonly products: ProductDTO[] = sampleProducts) {}

  async all() {
    return this.products;
  }

  async findBySlug(slug: string) {
    return this.products.find((product) => product.slug === slug) ?? null;
  }

  async stockFor(productIds: string[]) {
    const wanted = new Set(productIds);
    return new Map(
      this.products.flatMap((p) => (wanted.has(p.id) && "stock" in p ? [[p.id, p.stock] as const] : [])),
    );
  }
}
