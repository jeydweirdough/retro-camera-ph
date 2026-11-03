"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { addToCart } from "@/lib/cart/actions";
import { cn } from "@/lib/cn";

export interface AddToCartFormProps {
  productId: string;
  /** Most the shopper can pick (stock, capped by the per-line limit). */
  maxQuantity: number;
}

export function AddToCartForm({ productId, maxQuantity }: AddToCartFormProps) {
  const [result, action] = useActionState(addToCart, null);

  if (maxQuantity <= 0) {
    return (
      <SubmitButton disabled size="lg" className="self-start">
        Out of stock
      </SubmitButton>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Quantity</span>
          <select
            name="quantity"
            defaultValue="1"
            className="h-14 w-20 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {Array.from({ length: maxQuantity }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton size="lg">Add to cart</SubmitButton>
      </div>

      <p role="status" className={cn("min-h-5 text-sm", result?.ok === false && "text-red-600")}>
        {result?.message}{" "}
        {result?.ok && (
          <Link href="/cart" className="font-medium text-brand-700 underline dark:text-brand-400">
            View cart
          </Link>
        )}
      </p>
    </form>
  );
}
