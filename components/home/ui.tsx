import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Heading whose words rise out of a mask, one after another, when revealed. */
export function SplitHeading({
  as: Tag = "h2",
  lines,
  className,
  delay = 0,
  id,
}: {
  as?: "h1" | "h2" | "h3";
  lines: ReactNode[];
  className?: string;
  delay?: number;
  id?: string;
}) {
  let i = 0;
  return (
    <Tag id={id} data-reveal className={cn("split", className)} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {lines.map((line, index) => (
        <span key={index} className="block">
          {typeof line === "string"
            ? line.split(" ").map((word, w) => (
                <span key={w} className="split-line">
                  <span style={{ "--i": i++ } as CSSProperties}>{word}&nbsp;</span>
                </span>
              ))
            : (
                <span className="split-line">
                  <span style={{ "--i": i++ } as CSSProperties}>{line}</span>
                </span>
              )}
        </span>
      ))}
    </Tag>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Dashed circle arrow + black pill, as in the gallery mockup. */
export function PillLink({
  href,
  children,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <span className="grid size-8 place-items-center rounded-full border border-dashed border-black/50 transition-transform duration-500 group-hover:rotate-45">
        <ArrowIcon className="size-3.5" />
      </span>
      <span className="relative -ml-1 overflow-hidden rounded-full bg-black px-6 py-2.5 text-[10px] font-medium tracking-[0.08em] text-white uppercase">
        <span className="block transition-transform duration-500 group-hover:-translate-y-[180%]">{children}</span>
        <span aria-hidden="true" className="absolute inset-0 grid translate-y-full place-items-center transition-transform duration-500 group-hover:translate-y-0">
          {children}
        </span>
      </span>
    </>
  );
  const classes = cn("group inline-flex items-center", className);
  return external ? (
    <a href={href} target="_blank" rel="noopener" className={classes}>
      {content}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/** Orange rounded button with a chevron, as in the hero mockup. */
export function OrangeButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full bg-[#ee6a1c] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(238,106,28,0.9)] transition-all duration-300 hover:gap-3 hover:bg-[#ff7a26] hover:shadow-[0_14px_40px_-8px_rgba(238,106,28,1)]",
        className,
      )}
    >
      {children}
      <ChevronIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
