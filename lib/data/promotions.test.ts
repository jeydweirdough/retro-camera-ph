import { describe, expect, it } from "vitest";
import { sanityToPromotionDTO, type SanityPromotion } from "./promotions";

const blank: SanityPromotion = {
  _id: "p1",
  title: "Sale",
  type: "fixedOff",
  code: null,
  startsAt: null,
  endsAt: null,
  minSubtotal: null,
  percent: null,
  appliesTo: null,
  amount: null,
  productId: null,
  buy: null,
  get: null,
};

describe("sanityToPromotionDTO", () => {
  it("converts pesos typed in the Studio to centavos", () => {
    expect(sanityToPromotionDTO({ ...blank, amount: 499.5, minSubtotal: 10000 })).toEqual({
      id: "p1",
      title: "Sale",
      type: "fixedOff",
      amount: 49_950,
      minSubtotal: 1_000_000,
    });
  });

  it("drops promotions missing the fields their type needs", () => {
    expect(sanityToPromotionDTO(blank)).toBeNull();
    expect(sanityToPromotionDTO({ ...blank, type: "buyXGetY", buy: 2, get: 1 })).toBeNull();
    expect(sanityToPromotionDTO({ ...blank, type: "percentOff" })).toBeNull();
  });

  it("keeps codes and date windows", () => {
    const dto = sanityToPromotionDTO({
      ...blank,
      type: "percentOff",
      percent: 10,
      code: "LENS10",
      endsAt: "2026-12-31T00:00:00Z",
    });
    expect(dto).toMatchObject({ code: "LENS10", endsAt: "2026-12-31T00:00:00Z", appliesTo: [] });
  });
});
