import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof paddings;
  interactive?: boolean;
}

export function Card({
  padding = "md",
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white",
        "dark:border-zinc-800 dark:bg-zinc-950",
        paddings[padding],
        interactive &&
          "transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    />
  );
}
