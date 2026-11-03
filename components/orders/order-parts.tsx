import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge/badge";
import { formatDateTime } from "@/lib/format";
import { Money } from "@/lib/domain/money";
import { STATUS_LABELS, type OrderStatus } from "@/lib/domain/order";
import type { OrderDetail } from "@/lib/orders/repository";

const STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  awaiting_payment: "warning",
  payment_review: "accent",
  paid: "success",
  completed: "neutral",
  cancelled: "danger",
  expired: "danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

/** Items and totals. Used on the customer's order page and in the admin queue. */
export function OrderSummary({ detail }: { detail: OrderDetail }) {
  const { order, items } = detail;
  const totalBefore = order.subtotal.subtract(order.discount).add(order.fulfillmentFee);
  const matching = totalBefore.subtract(order.amountDue);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              {item.quantity}×{" "}
              <Link href={`/product/${item.slug}`} className="hover:underline">
                {item.name}
              </Link>
              {item.condition !== "New" && <span className="text-zinc-500"> ({item.condition})</span>}
            </span>
            <span className="tabular-nums">{Money.ofMinor(item.lineTotal).format()}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <Row label="Subtotal" value={order.subtotal.format()} />
        {!order.discount.isZero() && (
          <Row label={order.promoCode ? `Discounts (code ${order.promoCode})` : "Discounts"} value={`−${order.discount.format()}`} />
        )}
        <Row
          label={order.fulfillment === "pickup" ? "Store pickup" : "Delivery"}
          value={order.fulfillmentFee.isZero() ? "Free" : order.fulfillmentFee.format()}
        />
        {!matching.isZero() && <Row label="Payment-matching adjustment" value={`−${matching.format()}`} />}
        <div className="mt-1 flex justify-between text-base font-semibold">
          <dt>Amount to pay</dt>
          <dd className="tabular-nums">{order.amountDue.format()}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function DeliveryDetails({ detail }: { detail: OrderDetail }) {
  const { order } = detail;
  const a = order.address;
  return (
    <div className="text-sm">
      <p className="font-medium">{order.contactName}</p>
      <p>
        {order.contactPhone} · {order.contactEmail}
      </p>
      {a ? (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {a.street}, {a.barangay}, {a.city}, {a.province} {a.postalCode}
          {a.notes && <span className="block">Note: {a.notes}</span>}
        </p>
      ) : (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Store pickup</p>
      )}
    </div>
  );
}

export function OrderTimeline({ detail }: { detail: OrderDetail }) {
  return (
    <ol className="flex flex-col gap-2 border-l border-zinc-200 pl-4 text-sm dark:border-zinc-800">
      {detail.events.map((event) => (
        <li key={event.id}>
          <span className="font-medium">{event.note}</span>{" "}
          <span className="text-zinc-500">· {formatDateTime(event.createdAt)}</span>
        </li>
      ))}
    </ol>
  );
}
