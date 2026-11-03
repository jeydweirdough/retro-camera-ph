"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { cn } from "@/lib/cn";
import { adminOrderAction, retryStockAction } from "@/lib/orders/actions";

type Stage = "review" | "fulfil";

/** Confirm / reject a receipt, or complete / cancel a paid order. */
export function AdminOrderActions({ orderId, stage }: { orderId: string; stage: Stage }) {
  const [result, action] = useActionState(adminOrderAction, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Note to the customer (optional, shown in their order history)</span>
        <input
          name="reason"
          maxLength={500}
          placeholder={stage === "review" ? "e.g. Amount on receipt doesn't match" : "e.g. Shipped via LBC, tracking 123"}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {stage === "review" ? (
          <>
            <SubmitButton name="step" value="confirm" size="sm">
              Money received: confirm
            </SubmitButton>
            <SubmitButton name="step" value="reject" variant="secondary" size="sm">
              Reject receipt
            </SubmitButton>
          </>
        ) : (
          <SubmitButton name="step" value="complete" size="sm">
            Mark completed
          </SubmitButton>
        )}
        <SubmitButton name="step" value="cancel" variant="secondary" size="sm">
          Cancel order
        </SubmitButton>
      </div>
      <p role="status" className={cn("min-h-5 text-sm", result?.ok === false && "text-red-600")}>
        {result?.message}
      </p>
    </form>
  );
}

export function RetryStockButton({ code }: { code: string }) {
  const [result, action] = useActionState(retryStockAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="code" value={code} />
      <SubmitButton variant="secondary" size="sm">
        Update stock in Sanity
      </SubmitButton>
      <span role="status" className={cn("text-sm", result?.ok === false && "text-red-600")}>
        {result?.message}
      </span>
    </form>
  );
}
