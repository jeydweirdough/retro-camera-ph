import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/orders/order-parts";
import { LinkButton } from "@/components/ui/button/link-button";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { listOrdersForUser } from "@/lib/orders/repository";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function AccountPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const user = await requireUser("/account");
  const orders = await listOrdersForUser(user.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Hi, {user.name}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        <form action={signOut}>
          <SubmitButton variant="secondary" size="sm">
            Sign out
          </SubmitButton>
        </form>
      </div>

      <section aria-labelledby="orders-heading" className="flex flex-col gap-4">
        <h2 id="orders-heading" className="text-xl font-semibold">
          Your orders
        </h2>
        {orders.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-zinc-600 dark:text-zinc-400">No orders yet.</p>
            <LinkButton href="/shop">Start shopping</LinkButton>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.code}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{order.code}</span>
                    <span className="text-sm text-zinc-500">{formatDateTime(order.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="font-medium tabular-nums">{order.amountDue.format()}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
