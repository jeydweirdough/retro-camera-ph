import type { ButtonHTMLAttributes } from "react";
import type { ButtonAnimation, ButtonSize } from "./styles";

export interface BaseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  animation?: ButtonAnimation;
  loading?: boolean;
}
