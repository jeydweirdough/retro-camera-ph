import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { LinkButton } from "@/components/ui/button/link-button";
import { Card } from "@/components/ui/card/card";
import { requireUser } from "@/lib/auth/session";
import { loadQuote } from "@/lib/cart/load-quote";
import { getPaymentMethods, getStoreSettings } from "@/lib/data/checkout-content";
import { fulfillmentOptions } from "@/lib/domain/fulfillment";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <Checkout />
      </Suspense>
    </>
  );
}

async function Checkout() {
  const user = await requireUser("/checkout");
  const [{ quote }, settings, paymentMethods] = await Promise.all([
    loadQuote(),
    getStoreSettings(),
    getPaymentMethods(),
  ]);

  if (quote.lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>Your cart is empty.</p>
        <LinkButton href="/shop">Browse the shop</LinkButton>
      </div>
    );
  }
  if (!settings || paymentMethods.length === 0) {
    return <p>Checkout isn&apos;t open yet. Please check back soon.</p>;
  }
  if (quote.issues.length > 0) {
    return (
      <p>
        Some items in your cart changed.{" "}
        <Link href="/cart" className="font-medium text-brand-700 underline dark:text-brand-400">
          Review your cart
        </Link>{" "}
        before checking out.
      </p>
    );
  }

  const fulfillments = fulfillmentOptions(settings).map((option) => {
    const fee = option.fee(quote.total);
    return {
      method: option.method,
      label: option.label,
      description: option.describe(),
      fee: fee.toJSON(),
      total: quote.total.add(fee).toJSON(),
    };
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <CheckoutForm
        fulfillments={fulfillments}
        paymentMethods={paymentMethods.map(({ id, name }) => ({ id, name }))}
        defaults={{ contactName: user.name, contactEmail: user.email }}
      />

      <aside aria-label="Order summary">
        <Card className="flex flex-col gap-3 text-sm lg:sticky lg:top-6">
          <h2 className="font-semibold">Your order</h2>
          <ul className="flex flex-col gap-2">
            {quote.lines.map((line) => (
              <li key={line.product.id} className="flex justify-between gap-4">
                <span>
                  {line.quantity}× {line.product.name}
                </span>
                <span className="tabular-nums">{line.total.format()}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span>Subtotal</span>
            <span className="tabular-nums">{quote.subtotal.format()}</span>
          </div>
          {quote.discounts.map(({ promotion, amount }) => (
            <div key={promotion.id} className="flex justify-between text-emerald-700 dark:text-emerald-400">
              <span>{promotion.title}</span>
              <span className="tabular-nums">−{amount.format()}</span>
            </div>
          ))}
          <p className="text-xs text-zinc-500">Delivery fee and total are shown with your pickup or delivery choice.</p>
        </Card>
      </aside>
    </div>
  );
}
