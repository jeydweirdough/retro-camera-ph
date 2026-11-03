import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import {
  buttonAnimations,
  buttonBase,
  buttonSizes,
  buttonVariants,
  type ButtonAnimation,
  type ButtonSize,
  type ButtonVariant,
} from "./styles";

export interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  animation?: ButtonAnimation;
}

/** A link that looks like a button, for navigation (buttons are for actions). */
export function LinkButton({
  variant = "primary",
  size = "md",
  animation = "scale",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      {...props}
      className={cn(
        buttonBase,
        buttonSizes[size],
        buttonAnimations[animation],
        buttonVariants[variant],
        className,
      )}
    />
  );
}
