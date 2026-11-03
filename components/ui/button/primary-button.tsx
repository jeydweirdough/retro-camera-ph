import { cn } from "@/lib/cn";
import { BaseButton } from "./base-button";
import { buttonVariants } from "./styles";
import type { BaseButtonProps } from "./types";

export interface PrimaryButtonProps extends BaseButtonProps {
  rounded?: boolean;
}

export function PrimaryButton({
  rounded = false,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <BaseButton
      {...props}
      className={cn(buttonVariants.primary, rounded && "rounded-full", className)}
    />
  );
}
