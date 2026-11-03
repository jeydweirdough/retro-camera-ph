import { cacheLife, cacheTag } from "next/cache";
import type { ProductType } from "@/lib/domain/dto";
import { DEFAULT_CURRENCY, Money } from "@/lib/domain/money";
import type { PromotionDTO } from "@/lib/domain/promotion";
import { isSanityConfigured } from "@/sanity/env";
import { samplePromotions } from "./sample-promotions";
import { getSanityClient } from "./sanity-client";

/** Tag to revalidate when promotions change in Sanity. */
export const PROMOTIONS_TAG = "promotions";

/** What the GROQ query returns. Empty fields come back as null. */
export interface SanityPromotion {
  _id: string;
  title: string;
  type: PromotionDTO["type"];
  code: string | null;
  startsAt: string | null;
  endsAt: string | null;
  minSubtotal: number | null;
  percent: number | null;
  appliesTo: ProductType[] | null;
  amount: number | null;
  productId: string | null;
  buy: number | null;
  get: number | null;
}

const toCentavos = (pesos: number | null) => Money.fromMajor(pesos ?? 0, DEFAULT_CURRENCY).minor;

/** Turns a Sanity document into a DTO, or null if it's incomplete. */
export function sanityToPromotionDTO(raw: SanityPromotion): PromotionDTO | null {
  const base = {
    id: raw._id,
    title: raw.title,
    ...(raw.code && { code: raw.code }),
    ...(raw.startsAt && { startsAt: raw.startsAt }),
    ...(raw.endsAt && { endsAt: raw.endsAt }),
    minSubtotal: toCentavos(raw.minSubtotal),
  };

  switch (raw.type) {
    case "percentOff":
      return raw.percent ? { ...base, type: raw.type, percent: raw.percent, appliesTo: raw.appliesTo ?? [] } : null;
    case "fixedOff":
      return raw.amount ? { ...base, type: raw.type, amount: toCentavos(raw.amount) } : null;
    case "buyXGetY":
      return raw.productId && raw.buy && raw.get
        ? { ...base, type: raw.type, productId: raw.productId, buy: raw.buy, get: raw.get }
        : null;
    default:
      return null;
  }
}

/** Enabled promotions. Date windows are checked per request, not here. */
export async function getPromotions(): Promise<PromotionDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PROMOTIONS_TAG);
  if (!isSanityConfigured) return samplePromotions;

  const raw = await getSanityClient().fetch<SanityPromotion[]>(
    `*[_type == "promotion" && enabled != false]{
      _id, title, type, code, startsAt, endsAt, minSubtotal,
      percent, appliesTo, amount, "productId": product._ref, buy, get
    }`,
  );
  return raw.flatMap((promotion) => sanityToPromotionDTO(promotion) ?? []);
}
