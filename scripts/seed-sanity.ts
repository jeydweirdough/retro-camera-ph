/**
 * Loads the sample catalog into Sanity so the site has something to show.
 *
 *   npx sanity login
 *   npx sanity exec scripts/seed-sanity.ts --with-user-token
 *
 * Safe to re-run: documents use fixed IDs and are replaced, not duplicated.
 * Prices are placeholders; edit or delete these products in /studio.
 */
import type { IdentifiedSanityDocumentStub } from "@sanity/client";
import { getCliClient } from "sanity/cli";
import { sampleProducts } from "../lib/data/sample-repository";
import type { ProductDTO } from "../lib/domain/dto";
import { CURRENCIES, type Currency } from "../lib/domain/money";
import type { PriceMap } from "../lib/domain/price-list";

/** Centavos in code → pesos as typed in the Studio. */
function toStudioPrices(prices: PriceMap) {
  return Object.fromEntries(
    (Object.keys(prices) as Currency[]).map((currency) => [
      currency,
      prices[currency]! / 10 ** CURRENCIES[currency].minorUnits,
    ]),
  );
}

function toDocument(dto: ProductDTO): IdentifiedSanityDocumentStub {
  const base = {
    _id: dto.id,
    _type: dto.type,
    name: dto.name,
    slug: { _type: "slug", current: dto.slug },
    brand: dto.brand,
    description: dto.description,
  };

  if (dto.type === "bundle") {
    return {
      ...base,
      discountPercent: dto.discountPercent,
      items: dto.items.map((item, index) => ({
        _key: `item-${index}`,
        _type: "bundleItem",
        product: { _type: "reference", _ref: item.product.id },
        quantity: item.quantity,
      })),
    };
  }

  // Everything left over (mount, sensor, focalLength, kind…) has the same name in Sanity.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, type, slug, name, brand, description, images, updatedAt, prices, stock, ...specs } = dto;
  return { ...base, ...specs, prices: toStudioPrices(prices), stock };
}

const client = getCliClient();
const transaction = client.transaction();
for (const dto of sampleProducts) transaction.createOrReplace(toDocument(dto));

const result = await transaction.commit();
console.log(`Seeded ${result.documentIds.length} products into "${client.config().dataset}".`);
