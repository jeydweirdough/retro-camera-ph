"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { BaseButton } from "./base-button";
import { buttonVariants, type ButtonVariant } from "./styles";
import type { BaseButtonProps } from "./types";

export interface SubmitButtonProps extends Omit<BaseButtonProps, "type" | "loading"> {
  variant?: ButtonVariant;
}

/** Submit button that shows its spinner while the surrounding form is submitting. */
export function SubmitButton({ variant = "primary", className = "", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <BaseButton
      {...props}
      type="submit"
      loading={pending}
      className={cn(buttonVariants[variant], className)}
    />
  );
}
