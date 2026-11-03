// Shared by <button> components and <LinkButton>. `not-disabled:` matches
// enabled buttons and every link, so one set of classes works for both.

export const buttonBase = `
  relative inline-flex items-center justify-center
  overflow-hidden rounded-lg font-medium
  transition-[opacity,transform,background-color,box-shadow]
  duration-300 ease-in-out
  focus-visible:outline-2
  focus-visible:outline-offset-2
  focus-visible:outline-brand-600
  motion-reduce:transition-none
`;

export const buttonSizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export const buttonAnimations = {
  none: "",
  scale: "not-disabled:active:scale-[0.97]",
  lift: "not-disabled:hover:-translate-y-0.5",
};

export const buttonVariants = {
  primary: "bg-zinc-950 text-white not-disabled:hover:bg-zinc-800",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 not-disabled:hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:not-disabled:hover:bg-zinc-900",
};

export type ButtonSize = keyof typeof buttonSizes;
export type ButtonAnimation = keyof typeof buttonAnimations;
export type ButtonVariant = keyof typeof buttonVariants;
