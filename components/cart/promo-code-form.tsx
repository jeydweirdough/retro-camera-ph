"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { Input } from "@/components/ui/input/input";
import { applyPromoCode } from "@/lib/cart/actions";

export function PromoCodeForm() {
  const [result, action] = useActionState(applyPromoCode, null);

  return (
    <form action={action} className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          name="code"
          label="Promo code"
          autoComplete="off"
          autoCapitalize="characters"
          error={result?.ok === false ? result.message : undefined}
        />
      </div>
      <SubmitButton variant="secondary">Apply</SubmitButton>
    </form>
  );
}
