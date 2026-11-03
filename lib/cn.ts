import { twMerge, type ClassNameValue } from "tailwind-merge";

/**
 * Joins class names; when two Tailwind classes conflict, the later one wins
 * (`cn("rounded-lg", "rounded-full")` → `"rounded-full"`). Falsy values are skipped.
 */
export function cn(...classes: ClassNameValue[]) {
  return twMerge(...classes);
}
