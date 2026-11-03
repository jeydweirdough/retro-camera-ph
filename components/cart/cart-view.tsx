import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { LinkButton } from "@/components/ui/button/link-button";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { Card } from "@/components/ui/card/card";
import { removeCartLine, removePromoCode, updateCartLine } from "@/lib/cart/actions";
import { loadQuote } from "@/lib/cart/load-quote";
import { MAX_QUANTITY_PER_LINE } from "@/lib/domain/cart";
import type { Money } from "@/lib/domain/money";
import type { CartIssue, Quote } from "@/lib/domain/quote";
import { PromoCodeForm } from "./promo-code-form";

/** The priced cart. Reads cookies, so render inside <Suspense>. */
export async function CartView() {
  const { cart, quote } = await loadQuote();

  if (quote.lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Issues issues={quote.issues} />
        <p className="text-zinc-600 dark:text-zinc-400">Your cart is empty.</p>
        <LinkButton href="/shop">Browse the shop</LinkButton>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Items" className="flex flex-col gap-4">
        <Issues issues={quote.issues} />
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {quote.lines.map(({ product, quantity, unitPrice, total }) => (
            <li key={product.id} className="grid grid-cols-[5rem_1fr_auto] gap-4 py-4">
              <ProductImage image={product.images[0]} sizes="5rem" />

              <div className="flex flex-col gap-2">
                <Link href={product.path} className="font-medium hover:underline">
                  {product.name}
                </Link>
                <p className="text-sm text-zinc-500">{unitPrice.format()} each</p>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateCartLine} className="flex items-center gap-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <label className="text-sm">
                      <span className="sr-only">Quantity for {product.name}</span>
                      <input
                        type="number"
                        name="quantity"
                        min={0}
                        max={Math.min(product.stock, MAX_QUANTITY_PER_LINE)}
                        defaultValue={quantity}
                        className="h-9 w-16 rounded-lg border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    </label>
                    <SubmitButton variant="secondary" size="sm">
                      Update
                    </SubmitButton>
                  </form>
                  <form action={removeCartLine}>
                    <input type="hidden" name="productId" value={product.id} />
                    <SubmitButton variant="secondary" size="sm" aria-label={`Remove ${product.name}`}>
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </div>

              <p className="font-medium tabular-nums">{total.format()}</p>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Order summary" className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold">Order summary</h2>
          <Summary quote={quote} />

          {cart.promoCode ? (
            <AppliedCode code={cart.promoCode} status={quote.codeStatus} />
          ) : (
            <PromoCodeForm />
          )}

          <LinkButton href="/checkout" size="lg">
            Checkout
          </LinkButton>
          <p className="text-xs text-zinc-500">
            You&apos;ll pay in Philippine pesos by scanning a QR code. Items are held for 24 hours.
          </p>
        </Card>
      </aside>
    </div>
  );
}

function Summary({ quote }: { quote: Quote }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <Row label={`Subtotal (${quote.itemCount} ${quote.itemCount === 1 ? "item" : "items"})`} amount={quote.subtotal} />
      {quote.discounts.map(({ promotion, amount }) => (
        <Row
          key={promotion.id}
          label={`${promotion.title}: ${promotion.describe()}`}
          amount={amount}
          negative
        />
      ))}
      <div className="mt-2 flex justify-between border-t border-zinc-200 pt-3 text-base font-semibold dark:border-zinc-800">
        <dt>Total</dt>
        <dd className="tabular-nums">{quote.total.format()}</dd>
      </div>
    </dl>
  );
}

function Row({ label, amount, negative = false }: { label: string; amount: Money; negative?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={negative ? "text-emerald-700 dark:text-emerald-400" : undefined}>{label}</dt>
      <dd className="tabular-nums">
        {negative ? <span className="text-emerald-700 dark:text-emerald-400">−{amount.format()}</span> : amount.format()}
      </dd>
    </div>
  );
}

const CODE_MESSAGES: Record<Quote["codeStatus"], string> = {
  none: "",
  applied: "applied",
  unknown: "is no longer valid",
  "not-eligible": "doesn't apply to this cart yet (check the minimum spend or dates)",
};

function AppliedCode({ code, status }: { code: string; status: Quote["codeStatus"] }) {
  return (
    <form action={removePromoCode} className="flex items-center justify-between gap-3 text-sm">
      <p className={status === "applied" ? undefined : "text-amber-700 dark:text-amber-400"}>
        Code <strong>{code}</strong> {CODE_MESSAGES[status]}
      </p>
      <SubmitButton variant="secondary" size="sm" aria-label={`Remove code ${code}`}>
        Remove
      </SubmitButton>
    </form>
  );
}

function issueMessage(issue: CartIssue) {
  switch (issue.kind) {
    case "unavailable":
      return "An item in your cart is no longer sold, so it was left out.";
    case "out-of-stock":
      return `${issue.name} is out of stock, so it was left out.`;
    case "reduced":
      return `Only ${issue.available} of ${issue.name} left, so we lowered the quantity.`;
  }
}

function Issues({ issues }: { issues: CartIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul role="status" className="flex flex-col gap-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      {issues.map((issue) => (
        <li key={issue.productId}>{issueMessage(issue)}</li>
      ))}
    </ul>
  );
}

export function CartSkeleton() {
  return <div aria-busy="true" aria-label="Loading cart" className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />;
}
