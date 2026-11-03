"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { Input } from "@/components/ui/input/input";
import { Money, type MoneyJSON } from "@/lib/domain/money";
import { placeOrderAction } from "@/lib/orders/actions";
import type { CheckoutValues } from "@/lib/orders/checkout-form";

export interface FulfillmentChoice {
  method: string;
  label: string;
  description: string;
  fee: MoneyJSON;
  total: MoneyJSON;
}

export interface PaymentChoice {
  id: string;
  name: string;
}

export interface CheckoutFormProps {
  fulfillments: FulfillmentChoice[];
  paymentMethods: PaymentChoice[];
  defaults: { contactName: string; contactEmail: string };
}

const format = (money: MoneyJSON) => Money.fromJSON(money).format();

// Written out in full so Tailwind can find them (it can't see built-up class names).
const SHOW_WHEN_CHOSEN: Record<string, string> = {
  pickup: "group-has-[input[name=fulfillment][value=pickup]:checked]/checkout:flex",
  delivery: "group-has-[input[name=fulfillment][value=delivery]:checked]/checkout:flex",
};

/**
 * Address fields and totals switch with plain CSS (`:has(:checked)`), so the
 * form works the same with or without JavaScript.
 */
export function CheckoutForm({ fulfillments, paymentMethods, defaults }: CheckoutFormProps) {
  const [result, action] = useActionState(placeOrderAction, null);
  const v: Partial<CheckoutValues> = result?.values ?? defaults;
  const errors = result?.errors ?? {};
  const chosen = v.fulfillment || fulfillments[0]?.method;

  return (
    <form action={action} className="group/checkout flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-semibold">1. Pickup or delivery</legend>
        {fulfillments.map((option) => (
          <label
            key={option.method}
            className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 dark:border-zinc-800 dark:has-[:checked]:bg-brand-950"
          >
            <input
              type="radio"
              name="fulfillment"
              value={option.method}
              defaultChecked={option.method === chosen}
              className="mt-1 accent-brand-600"
            />
            <span className="flex flex-1 flex-col">
              <span className="flex justify-between gap-4 font-medium">
                {option.label}
                <span className="tabular-nums">{Money.fromJSON(option.fee).isZero() ? "Free" : format(option.fee)}</span>
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-lg font-semibold">2. Contact details</legend>
        <Input name="contactName" label="Full name" autoComplete="name" defaultValue={v.contactName} error={errors.contactName} required />
        <Input
          name="contactPhone"
          type="tel"
          label="Mobile number"
          autoComplete="tel"
          placeholder="0917 123 4567"
          defaultValue={v.contactPhone}
          error={errors.contactPhone}
          required
        />
        <Input name="contactEmail" type="email" label="Email" autoComplete="email" defaultValue={v.contactEmail} error={errors.contactEmail} required />
      </fieldset>

      <fieldset className="hidden flex-col gap-4 group-has-[input[name=fulfillment][value=delivery]:checked]/checkout:flex">
        <legend className="mb-3 text-lg font-semibold">Delivery address</legend>
        <Input name="street" label="House no., street, building" autoComplete="address-line1" defaultValue={v.street} error={errors.street} />
        <Input name="barangay" label="Barangay" autoComplete="address-line2" defaultValue={v.barangay} error={errors.barangay} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="city" label="City / municipality" autoComplete="address-level2" defaultValue={v.city} error={errors.city} />
          <Input name="province" label="Province" autoComplete="address-level1" defaultValue={v.province} error={errors.province} />
        </div>
        <Input
          name="postalCode"
          label="ZIP code"
          inputMode="numeric"
          autoComplete="postal-code"
          defaultValue={v.postalCode}
          error={errors.postalCode}
          className="w-32"
        />
        <Input name="notes" label="Delivery notes (optional)" defaultValue={v.notes} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-semibold">3. Pay by QR code</legend>
        {paymentMethods.map((method, index) => (
          <label
            key={method.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 dark:border-zinc-800 dark:has-[:checked]:bg-brand-950"
          >
            <input
              type="radio"
              name="paymentMethodId"
              value={method.id}
              defaultChecked={v.paymentMethodId ? v.paymentMethodId === method.id : index === 0}
              className="accent-brand-600"
            />
            <span className="font-medium">{method.name}</span>
          </label>
        ))}
        {errors.paymentMethodId && <p className="text-sm text-red-600">{errors.paymentMethodId}</p>}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          After placing your order you&apos;ll see the QR code and the exact amount to pay. Your items are held for 24 hours.
        </p>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {fulfillments.map((option) => (
          <p
            key={option.method}
            className={`hidden justify-between text-lg font-semibold ${SHOW_WHEN_CHOSEN[option.method]}`}
          >
            <span>Total</span>
            <span className="tabular-nums">{format(option.total)}</span>
          </p>
        ))}
        <p role="alert" className="min-h-5 text-sm text-red-600">
          {result?.message}
        </p>
        <SubmitButton size="lg">Place order</SubmitButton>
      </div>
    </form>
  );
}
