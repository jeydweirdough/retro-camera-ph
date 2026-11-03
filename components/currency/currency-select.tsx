"use client";

import { setCurrency, useCurrency } from "@/lib/client/currency-store";
import { CURRENCIES, type Currency } from "@/lib/domain/money";

export function CurrencySelect() {
  const currency = useCurrency();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as Currency)}
        className="h-9 rounded-lg border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {(Object.keys(CURRENCIES) as Currency[]).map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}
