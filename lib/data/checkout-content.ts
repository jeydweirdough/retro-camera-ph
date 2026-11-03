import { cacheLife, cacheTag } from "next/cache";
import type { StoreSettingsDTO } from "@/lib/domain/fulfillment";
import { DEFAULT_CURRENCY, Money } from "@/lib/domain/money";
import { isSanityConfigured } from "@/sanity/env";
import { STORE_SETTINGS_ID } from "@/sanity/ids";
import { getSanityClient } from "./sanity-client";

export const SETTINGS_TAG = "settings";
export const PAYMENT_METHODS_TAG = "payment-methods";

/** A QR code customers can pay with, from Sanity. */
export interface PaymentMethodDTO {
  id: string;
  name: string;
  type: string;
  qrUrl: string | null;
  accountName: string;
  accountNumberLast4: string;
  instructions?: string;
}

const centavos = (pesos: number) => Money.fromMajor(pesos, DEFAULT_CURRENCY).minor;

// Placeholders for sample mode (no Sanity), so checkout can be tried locally.
const SAMPLE_SETTINGS: StoreSettingsDTO = {
  deliveryFee: 150_00,
  freeDeliveryMinimum: 5_000_00,
  pickup: { address: "Sample pickup address", hours: "Mon–Sat, 10am–6pm" },
};
const SAMPLE_PAYMENT_METHODS: PaymentMethodDTO[] = [
  {
    id: "sample-gcash",
    name: "GCash (sample)",
    type: "gcash",
    qrUrl: null,
    accountName: "Sample Account",
    accountNumberLast4: "1234",
  },
];

/** Delivery and pickup options, or null if the owner hasn't set them yet. */
export async function getStoreSettings(): Promise<StoreSettingsDTO | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(SETTINGS_TAG);
  if (!isSanityConfigured) return SAMPLE_SETTINGS;

  const raw = await getSanityClient().fetch<{
    deliveryFee: number | null;
    freeDeliveryMinimum: number | null;
    pickupEnabled: boolean | null;
    pickupAddress: string | null;
    pickupHours: string | null;
  } | null>(`*[_id == $id][0]{ deliveryFee, freeDeliveryMinimum, pickupEnabled, pickupAddress, pickupHours }`, {
    id: STORE_SETTINGS_ID,
  });
  if (!raw || raw.deliveryFee === null) return null;

  return {
    deliveryFee: centavos(raw.deliveryFee),
    ...(raw.freeDeliveryMinimum !== null && { freeDeliveryMinimum: centavos(raw.freeDeliveryMinimum) }),
    ...(raw.pickupEnabled &&
      raw.pickupAddress && { pickup: { address: raw.pickupAddress, ...(raw.pickupHours && { hours: raw.pickupHours }) } }),
  };
}

/** Enabled QR payment methods, in the owner's chosen order. */
export async function getPaymentMethods(): Promise<PaymentMethodDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PAYMENT_METHODS_TAG);
  if (!isSanityConfigured) return SAMPLE_PAYMENT_METHODS;

  return getSanityClient().fetch<PaymentMethodDTO[]>(
    `*[_type == "paymentMethod" && enabled != false && defined(qrCode.asset)] | order(sortOrder asc) {
      "id": _id, name, type, "qrUrl": qrCode.asset->url, accountName, accountNumberLast4, instructions
    }`,
  );
}
