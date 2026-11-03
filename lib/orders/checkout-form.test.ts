import { describe, expect, it } from "vitest";
import { normalizePhMobile, validateCheckout, type CheckoutValues } from "./checkout-form";

const base: CheckoutValues = {
  fulfillment: "delivery",
  paymentMethodId: "pm-1",
  contactName: "Juan Dela Cruz",
  contactPhone: "0917 123 4567",
  contactEmail: "juan@example.com",
  street: "123 Rizal St",
  barangay: "Poblacion",
  city: "Makati",
  province: "Metro Manila",
  postalCode: "1210",
  notes: "",
};

describe("checkout form", () => {
  it("normalizes PH mobile numbers", () => {
    expect(normalizePhMobile("0917 123 4567")).toBe("+639171234567");
    expect(normalizePhMobile("+63 917-123-4567")).toBe("+639171234567");
    expect(normalizePhMobile("639171234567")).toBe("+639171234567");
    expect(normalizePhMobile("02 8123 4567")).toBeNull(); // landline
    expect(normalizePhMobile("0917 123 456")).toBeNull(); // too short
  });

  it("accepts a complete delivery order", () => {
    expect(validateCheckout(base, true)).toEqual({});
  });

  it("only requires an address for delivery", () => {
    const noAddress = { ...base, street: "", barangay: "", city: "", province: "", postalCode: "" };
    expect(Object.keys(validateCheckout(noAddress, true))).toEqual([
      "street",
      "barangay",
      "city",
      "province",
      "postalCode",
    ]);
    expect(validateCheckout(noAddress, false)).toEqual({});
  });

  it("explains each problem", () => {
    const errors = validateCheckout({ ...base, contactPhone: "123", contactEmail: "nope", postalCode: "12" }, true);
    expect(errors).toEqual({
      contactPhone: "Enter a PH mobile number, e.g. 0917 123 4567.",
      contactEmail: "Enter a valid email.",
      postalCode: "Use the 4-digit ZIP code.",
    });
  });
});
