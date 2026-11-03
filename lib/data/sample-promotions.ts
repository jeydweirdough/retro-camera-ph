import type { BuyXGetYDTO, FixedOffDTO, PercentOffDTO, PromotionDTO } from "@/lib/domain/promotion";
import { sdCard128 } from "./sample-repository";

// Placeholder promotions for development until Sanity has real ones.

export const cardsBuy2Get1: BuyXGetYDTO = {
  type: "buyXGetY",
  id: "promo-cards-b2g1",
  title: "SD card deal",
  minSubtotal: 0,
  productId: sdCard128.id,
  buy: 2,
  get: 1,
};

export const welcomeCode: FixedOffDTO = {
  type: "fixedOff",
  id: "promo-welcome",
  title: "Welcome discount",
  code: "WELCOME500",
  minSubtotal: 10_000_00,
  amount: 500_00,
};

export const lensWeek: PercentOffDTO = {
  type: "percentOff",
  id: "promo-lens-week",
  title: "Lens week",
  code: "LENS10",
  minSubtotal: 0,
  percent: 10,
  appliesTo: ["lens"],
};

export const samplePromotions: PromotionDTO[] = [cardsBuy2Get1, welcomeCode, lensWeek];
