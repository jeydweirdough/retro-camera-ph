import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DeliveryDetails, OrderSummary, OrderTimeline, StatusBadge } from "@/components/orders/order-parts";
import { ReceiptUploadForm } from "@/components/orders/receipt-upload-form";
import { Card } from "@/components/ui/card/card";
import { requireUser } from "@/lib/auth/session";
import { getPaymentMethods, type PaymentMethodDTO } from "@/lib/data/checkout-content";
import { formatDateTime } from "@/lib/format";
import { getOrderDetail, type OrderDetail } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/account/orders/[code]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
      {params.then(({ code }) => (
        <Order code={code} />
      ))}
    </Suspense>
  );
}

async function Order({ code }: { code: string }) {
  const user = await requireUser(`/account/orders/${code}`);
  const detail = await getOrderDetail(code);
  // Someone else's order looks exactly like a missing one.
  if (!detail || detail.order.userId !== user.id) notFound();

  const { order } = detail;
  const method = (await getPaymentMethods()).find((m) => m.id === order.paymentMethodId);

  return (
    <>
      <Breadcrumbs
        crumbs={[
          { name: "Account", href: "/account" },
          { name: order.code, href: `/account/orders/${order.code}` },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Order {order.code}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-8">
          {(order.status === "awaiting_payment" || order.status === "payment_review") && (
            <PaymentPanel detail={detail} method={method} />
          )}
          {order.status === "expired" && (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
              This order wasn&apos;t paid within 24 hours, so its items were released. You can order again from the
              shop if they&apos;re still available.
            </p>
          )}
          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-3 font-semibold">
              History
            </h2>
            <OrderTimeline detail={detail} />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <h2 className="font-semibold">Summary</h2>
            <OrderSummary detail={detail} />
          </Card>
          <Card className="flex flex-col gap-2">
            <h2 className="font-semibold">{order.fulfillment === "pickup" ? "Pickup" : "Delivery"}</h2>
            <DeliveryDetails detail={detail} />
          </Card>
        </aside>
      </div>
    </>
  );
}

function PaymentPanel({ detail, method }: { detail: OrderDetail; method?: PaymentMethodDTO }) {
  const { order, receipts } = detail;
  const inReview = order.status === "payment_review";

  return (
    <Card className="flex flex-col gap-5">
      {inReview ? (
        <div>
          <h2 className="text-lg font-semibold">We&apos;re checking your payment</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We received your receipt on {formatDateTime(receipts[0].uploadedAt)} and will confirm once the money
            arrives. Your items stay reserved meanwhile.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold">Pay {order.amountDue.format()} by QR code</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Please pay by <strong>{formatDateTime(order.expiresAt)}</strong>, or the order is cancelled and the
              items released. Pay the <strong>exact amount, including centavos</strong>; it&apos;s how we match your
              payment to this order.
            </p>
          </div>

          {method ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative aspect-square w-56 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
                {method.qrUrl ? (
                  <Image src={method.qrUrl} alt={`${method.name} QR code`} fill sizes="14rem" className="object-contain p-2" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm text-zinc-500">QR code</span>
                )}
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Pay with</dt>
                  <dd className="font-medium">{method.name}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Account name</dt>
                  <dd className="font-medium">{method.accountName}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Account number ends in</dt>
                  <dd className="font-medium tabular-nums">{method.accountNumberLast4}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Exact amount</dt>
                  <dd className="text-xl font-semibold tabular-nums">{order.amountDue.format()}</dd>
                </div>
                {method.instructions && <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">{method.instructions}</p>}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-red-700">
              This payment method is no longer available. Please contact us with your order code {order.code}.
            </p>
          )}
        </>
      )}

      <ReceiptUploadForm code={order.code} replacing={inReview} />
    </Card>
  );
}
