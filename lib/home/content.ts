/**
 * Copy and photo slots for the home page, kept in one place so they're easy to edit.
 *
 * Photos are background-removed cut-outs in /public/home/, made from the
 * originals in /public/images/. A slot without `src` shows a drawn
 * placeholder camera in the slot's `tone`.
 *
 * Only real store facts belong here. Don't invent reviews, ratings or specs.
 */

export type CameraTone = "ivory" | "sunny" | "tangerine" | "mint" | "graphite" | "silver";

export interface PhotoSlot {
  src?: string;
  alt: string;
  tone: CameraTone;
  /** Short model name shown in captions. */
  name?: string;
}

/** The store's own camera photos, one entry per cut-out. */
export const cameras = {
  canonet: { src: "/home/canon-canonet.webp", name: "Canon Canonet", alt: "Canon Canonet rangefinder in a black half case", tone: "silver" },
  keystone: { src: "/home/keystone-everflash-af2.webp", name: "Keystone Everflash AF2", alt: "Keystone Everflash AF2 point-and-shoot film camera", tone: "graphite" },
  konicaBlack: { src: "/home/konica-efj-black.webp", name: "Konica EFJ", alt: "Black Konica EFJ Auto Date film camera", tone: "graphite" },
  konicaRed: { src: "/home/konica-efj-red.webp", name: "Konica EFJ Red", alt: "Red Konica EFJ Auto Date film camera", tone: "tangerine" },
  ixy: { src: "/home/canon-ixy-pair.webp", name: "Canon IXY", alt: "Two silver Canon IXY compact cameras", tone: "silver" },
  olympus: { src: "/home/olympus-pt-056.webp", name: "Olympus PT-056", alt: "Olympus PT-056 Tough waterproof camera housing with red lens cap", tone: "graphite" },
  minolta: { src: "/home/minolta-af-slr.webp", name: "Minolta AF SLR", alt: "Minolta autofocus SLR with an AF 35–105mm zoom lens", tone: "graphite" },
  ricoh: { src: "/home/ricoh-af-super.webp", name: "Ricoh AF Super", alt: "Ricoh AF Super point-and-shoot film camera", tone: "graphite" },
  fuji: { src: "/home/fuji-hd-r.webp", name: "Fuji HD-R", alt: "Fuji HD-R weatherproof film camera with Fujinon 38mm lens", tone: "graphite" },
  holga: { src: "/home/holga-120-gcfn.webp", name: "Holga 120 GCFN", alt: "Holga 120 GCFN medium-format toy camera with striped strap", tone: "graphite" },
} satisfies Record<string, PhotoSlot>;

const c = cameras;

export const homePhotos = {
  hero: [c.konicaRed, c.canonet, c.fuji],
  whoWeAre: c.holga,
  details: [c.minolta, c.ixy, c.keystone],
  creatives: c.olympus,
  follow: c.ricoh,
  lensCard: c.konicaBlack,
  cardMini: [c.konicaRed, c.canonet, c.holga],
  gallery: [c.minolta, c.keystone, c.konicaBlack, c.ricoh],
  photoOfDay: [c.canonet, c.olympus],
  spotlight: [c.fuji, c.konicaRed, c.ixy, c.holga],
  collections: [c.keystone, c.konicaRed, c.canonet],
} satisfies Record<string, PhotoSlot | PhotoSlot[]>;

/**
 * A real customer review, shown with stars in the hero. Leave it null until
 * you paste one from the Facebook page. The hero shows a store promise instead.
 */
export const heroReview: { quote: string; author: string } | null = null;

export const storeFacts = {
  location: "Las Piñas, Metro Manila",
  promise: "New and vintage cameras, checked and graded before they reach you.",
};
