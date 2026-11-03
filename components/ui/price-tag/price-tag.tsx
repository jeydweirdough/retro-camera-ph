import { cn } from "@/lib/cn";
import { Money, type MoneyJSON } from "@/lib/domain/money";

const sizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
};

export interface PriceTagProps {
  price: MoneyJSON;
  /** Original price, shown struck through when higher than `price`. */
  compareAt?: MoneyJSON;
  size?: keyof typeof sizes;
  className?: string;
}

export function PriceTag({ price, compareAt, size = "md", className = "" }: PriceTagProps) {
  const now = Money.fromJSON(price);
  const was = compareAt && Money.fromJSON(compareAt);
  const onSale = was !== undefined && was.currency === now.currency && was.compare(now) > 0;

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold tabular-nums", sizes[size])}>
        {onSale && <span className="sr-only">Sale price: </span>}
        {now.format()}
      </span>

      {onSale && (
        <>
          <s className="text-sm text-zinc-500 tabular-nums">
            <span className="sr-only">Original price: </span>
            {was.format()}
          </s>
          <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
            Save {was.subtract(now).format()}
          </span>
        </>
      )}
    </p>
  );
}
