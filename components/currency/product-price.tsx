"use client";

import { PriceTag, type PriceTagProps } from "@/components/ui/price-tag/price-tag";
import { useCurrency } from "@/lib/client/currency-store";
import { DEFAULT_CURRENCY, type Currency } from "@/lib/domain/money";
import type { PriceMap } from "@/lib/domain/price-list";

export interface ProductPriceProps extends Omit<PriceTagProps, "price" | "compareAt"> {
  price: PriceMap;
  compareAt?: PriceMap;
}

/** A product price in the shopper's chosen currency (PHP if not available). */
export function ProductPrice({ price, compareAt, ...props }: ProductPriceProps) {
  const chosen = useCurrency();
  const currency: Currency = price[chosen] !== undefined ? chosen : DEFAULT_CURRENCY;
  const was = compareAt?.[currency];

  return (
    <PriceTag
      {...props}
      price={{ minor: price[currency]!, currency }}
      compareAt={was !== undefined ? { minor: was, currency } : undefined}
    />
  );
}
