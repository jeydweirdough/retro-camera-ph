import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminOrderActions, RetryStockButton } from "@/components/admin/admin-order-actions";
import { DeliveryDetails, OrderSummary, OrderTimeline } from "@/components/orders/order-parts";
import { Badge } from "@/components/ui/badge/badge";
import { Card } from "@/components/ui/card/card";
import { requireAdmin } from "@/lib/auth/session";
import { getPaymentMethods } from "@/lib/data/checkout-content";
import { canWriteStock } from "@/lib/data/sanity-stock";
import { formatDateTime } from "@/lib/format";
import { adminQueue, getOrderDetail, type OrderDetail } from "@/lib/orders/repository";
import { receiptViewUrl } from "@/lib/storage/receipts";

export const metadata: Metadata = { title: "Admin: payments", robots: { index: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
      <Admin />
    </Suspense>
  );
}

async function Admin() {
  await requireAdmin();
  const queue = await adminQueue();
  const [toReview, toFulfil, methods] = await Promise.all([
    Promise.all(queue.toReview.map((o) => getOrderDetail(o.code))),
    Promise.all(queue.toFulfil.map((o) => getOrderDetail(o.code))),
    getPaymentMethods(),
  ]);
  const methodName = (id: string) => methods.find((m) => m.id === id)?.name ?? "Unknown method";

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
      <AdminNav current="/admin" />
      {!canWriteStock() && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          SANITY_WRITE_TOKEN isn&apos;t set, so confirming a payment won&apos;t lower stock in Sanity. Paid orders keep
          holding their items until it&apos;s set and you click &ldquo;Update stock in Sanity&rdquo;.
        </p>
      )}

      <Section title="Receipts to check" empty="No receipts waiting.">
        {toReview.flatMap((detail) =>
          detail ? [<ReviewCard key={detail.order.id} detail={detail} methodName={methodName(detail.order.paymentMethodId)} />] : [],
        )}
      </Section>

      <Section title="Paid: prepare and send" empty="Nothing to send out.">
        {toFulfil.flatMap((detail) => (detail ? [<FulfilCard key={detail.order.id} detail={detail} />] : []))}
      </Section>
    </>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">
        {title} <span className="text-zinc-400">({children.length})</span>
      </h2>
      {children.length === 0 ? <p className="text-zinc-500">{empty}</p> : children}
    </section>
  );
}

async function ReviewCard({ detail, methodName }: { detail: OrderDetail; methodName: string }) {
  const { order } = detail;
  const receipt = detail.receipts[0];
  const receiptUrl = receipt ? await receiptViewUrl(receipt.objectKey) : null;

  return (
    <Card className="grid gap-6 lg:grid-cols-[16rem_1fr_20rem]">
      <div className="flex flex-col gap-2">
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="block">
            {/* Signed, short-lived private URL: plain <img>, not the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt={`Receipt for ${order.code}`} className="max-h-96 w-full rounded-lg border object-contain" />
          </a>
        )}
        <p className="text-xs text-zinc-500">
          Uploaded {receipt ? formatDateTime(receipt.uploadedAt) : "—"}. Open to view full size.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-lg font-semibold">
            {order.code} · {order.amountDue.format()}
          </p>
          <p className="text-sm text-zinc-500">
            via {methodName} · ordered {formatDateTime(order.createdAt)}
          </p>
        </div>
        <ReceiptCheckView receipt={receipt} />
        <p className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
          Before confirming, check your {methodName} or bank app for an incoming <strong>{order.amountDue.format()}</strong>.
          The receipt check is a hint only; screenshots can be edited.
        </p>
        <AdminOrderActions orderId={order.id} stage="review" />
      </div>

      <div className="flex flex-col gap-4">
        <OrderSummary detail={detail} />
        <DeliveryDetails detail={detail} />
      </div>
    </Card>
  );
}

function ReceiptCheckView({ receipt }: { receipt?: OrderDetail["receipts"][number] }) {
  if (!receipt) return null;
  if (receipt.ocrStatus === "pending") return <Badge>Reading receipt… refresh in a moment</Badge>;

  const flags = receipt.check?.flags ?? [];
  return (
    <div className="flex flex-col gap-2 text-sm">
      {flags.length === 0 ? (
        <Badge tone="success" className="self-start">
          Receipt matches amount and recipient
        </Badge>
      ) : (
        <ul className="flex flex-col gap-1 rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {flags.map((flag) => (
            <li key={flag}>⚠ {flag}</li>
          ))}
        </ul>
      )}
      {receipt.reference && <p className="text-zinc-500">Reference no. {receipt.reference}</p>}
    </div>
  );
}

function FulfilCard({ detail }: { detail: OrderDetail }) {
  const { order } = detail;
  return (
    <Card className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold">
          {order.code} · {order.fulfillment === "pickup" ? "Pickup" : "Delivery"}
        </p>
        <DeliveryDetails detail={detail} />
        {!order.stockDeducted && (
          <div className="flex flex-col gap-2 text-sm text-amber-800 dark:text-amber-300">
            Stock for this order hasn&apos;t been lowered in Sanity yet.
            <RetryStockButton code={order.code} />
          </div>
        )}
        <AdminOrderActions orderId={order.id} stage="fulfil" />
        <OrderTimeline detail={detail} />
      </div>
      <OrderSummary detail={detail} />
    </Card>
  );
}
