/**
 * Adds the store's own photographed cameras (the cut-outs in public/home/) to Sanity.
 *
 *   node --env-file=.env.local --experimental-strip-types scripts/seed-store-cameras.ts
 *
 * Needs SANITY_WRITE_TOKEN. Safe to re-run: documents use fixed IDs and are
 * replaced, and Sanity reuses an image asset it already has.
 *
 * PRICES AND CONDITION GRADES ARE PLACEHOLDERS. Set the real ones in /studio
 * before selling, and add condition notes after checking each camera.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-11-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

interface Seed {
  id: string;
  type: "camera" | "accessory";
  file: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  alt: string;
  /** Pesos, as typed in the Studio. Placeholder. */
  price: number;
  specs: Record<string, unknown>;
}

const film = (filmFormat: string, style: string, mount = "fixed") => ({ medium: "film", mount, filmFormat, style });

const SEEDS: Seed[] = [
  {
    id: "cam-store-canon-canonet",
    type: "camera",
    file: "canon-canonet.webp",
    name: "Canon Canonet",
    slug: "canon-canonet",
    brand: "Canon",
    description: "Classic Canon Canonet 35mm rangefinder with a fixed lens, shown in its black half case.",
    alt: "Canon Canonet rangefinder in a black half case",
    price: 6500,
    specs: film("35mm", "rangefinder"),
  },
  {
    id: "cam-store-canon-ixy-pair",
    type: "camera",
    file: "canon-ixy-pair.webp",
    name: "Canon IXY APS Compact (Pair)",
    slug: "canon-ixy-aps-compact-pair",
    brand: "Canon",
    description: "Two silver Canon IXY zoom compacts for APS film, sold together.",
    alt: "Two silver Canon IXY compact cameras",
    price: 4500,
    specs: film("aps", "point-and-shoot"),
  },
  {
    id: "cam-store-fuji-hd-r",
    type: "camera",
    file: "fuji-hd-r.webp",
    name: "Fuji HD-R",
    slug: "fuji-hd-r",
    brand: "Fujifilm",
    description: "Weatherproof Fuji HD-R 35mm film camera with a Fujinon 38mm lens. Made for beach and rain days.",
    alt: "Fuji HD-R weatherproof film camera with Fujinon 38mm lens",
    price: 5500,
    specs: film("35mm", "point-and-shoot"),
  },
  {
    id: "cam-store-holga-120-gcfn",
    type: "camera",
    file: "holga-120-gcfn.webp",
    name: "Holga 120 GCFN",
    slug: "holga-120-gcfn",
    brand: "Holga",
    description: "Holga 120 GCFN medium-format toy camera with a glass lens and built-in color flash. Comes with a striped strap.",
    alt: "Holga 120 GCFN medium-format toy camera with striped strap",
    price: 3800,
    specs: film("120", "point-and-shoot"),
  },
  {
    id: "cam-store-keystone-everflash-af2",
    type: "camera",
    file: "keystone-everflash-af2.webp",
    name: "Keystone Everflash AF2",
    slug: "keystone-everflash-af2",
    brand: "Keystone",
    description: "Keystone Everflash AF2 35mm point-and-shoot film camera with built-in flash.",
    alt: "Keystone Everflash AF2 point-and-shoot film camera",
    price: 2200,
    specs: film("35mm", "point-and-shoot"),
  },
  {
    id: "cam-store-konica-efj-black",
    type: "camera",
    file: "konica-efj-black.webp",
    name: "Konica EFJ Auto Date (Black)",
    slug: "konica-efj-auto-date-black",
    brand: "Konica",
    description: "Black Konica EFJ Auto Date 35mm point-and-shoot film camera with date imprint.",
    alt: "Black Konica EFJ Auto Date film camera",
    price: 2800,
    specs: film("35mm", "point-and-shoot"),
  },
  {
    id: "cam-store-konica-efj-red",
    type: "camera",
    file: "konica-efj-red.webp",
    name: "Konica EFJ Auto Date (Red)",
    slug: "konica-efj-auto-date-red",
    brand: "Konica",
    description: "Red Konica EFJ Auto Date 35mm point-and-shoot film camera with date imprint.",
    alt: "Red Konica EFJ Auto Date film camera",
    price: 3200,
    specs: film("35mm", "point-and-shoot"),
  },
  {
    id: "cam-store-minolta-af-slr",
    type: "camera",
    file: "minolta-af-slr.webp",
    name: "Minolta AF SLR with AF 35–105mm",
    slug: "minolta-af-slr-35-105mm",
    brand: "Minolta",
    description: "Minolta autofocus 35mm SLR paired with a Minolta AF 35–105mm zoom lens.",
    alt: "Minolta autofocus SLR with an AF 35–105mm zoom lens",
    price: 7500,
    specs: film("35mm", "slr", "minolta-a"),
  },
  {
    id: "cam-store-ricoh-af-super",
    type: "camera",
    file: "ricoh-af-super.webp",
    name: "Ricoh AF Super",
    slug: "ricoh-af-super",
    brand: "Ricoh",
    description: "Ricoh AF Super 35mm autofocus point-and-shoot film camera.",
    alt: "Ricoh AF Super point-and-shoot film camera",
    price: 2500,
    specs: film("35mm", "point-and-shoot"),
  },
  {
    id: "acc-store-olympus-pt-056",
    type: "accessory",
    file: "olympus-pt-056.webp",
    name: "Olympus PT-056 Underwater Housing",
    slug: "olympus-pt-056-underwater-housing",
    brand: "Olympus",
    description: "Olympus PT-056 Tough waterproof housing for compact cameras, with red lens cap.",
    alt: "Olympus PT-056 Tough waterproof camera housing with red lens cap",
    price: 2000,
    specs: { kind: "Underwater housings", compatibleMounts: [] },
  },
];

const root = join(import.meta.dirname, "..", "public", "home");
const transaction = client.transaction();

for (const seed of SEEDS) {
  const asset = await client.assets.upload("image", await readFile(join(root, seed.file)), { filename: seed.file });
  transaction.createOrReplace({
    _id: seed.id,
    _type: seed.type,
    name: seed.name,
    slug: { _type: "slug", current: seed.slug },
    brand: seed.brand,
    description: seed.description,
    images: [{ _key: "main", _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: seed.alt }],
    prices: { PHP: seed.price },
    stock: 1,
    condition: "good",
    ...seed.specs,
  });
  console.log(`Prepared ${seed.name}`);
}

const result = await transaction.commit();
console.log(`Seeded ${result.documentIds.length} products into "${client.config().dataset}".`);
