import { cn } from "@/lib/cn";
import { buttonAnimations, buttonBase, buttonSizes } from "./styles";
import type { BaseButtonProps } from "./types";

export function BaseButton({
  children,
  size = "md",
  animation = "scale",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}: BaseButtonProps) {
  const inactive = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={cn(
        buttonBase,
        buttonSizes[size],
        buttonAnimations[animation],
        inactive ? "cursor-not-allowed opacity-50" : "cursor-pointer opacity-100",
        className,
      )}
    >
      <span
        aria-hidden={loading}
        className={`
          transition-all duration-200
          ${loading ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        {children}
      </span>

      <span
        aria-hidden="true"
        className={`
          pointer-events-none absolute inset-0
          flex items-center justify-center
          transition-all duration-300
          ${loading ? "scale-100 opacity-100" : "scale-75 opacity-0"}
        `}
      >
        <span
          className="
            h-4 w-4 rounded-full border-2
            border-current border-t-transparent
            animate-spin [animation-duration:800ms]
            motion-reduce:animate-none
          "
        />
      </span>

      {/* Always mounted so screen readers notice when the text changes. */}
      <span className="sr-only" role="status">
        {loading ? "Loading" : ""}
      </span>
    </button>
  );
}
