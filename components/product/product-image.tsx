import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ProductImage as ProductImageData } from "@/lib/domain/dto";

export interface ProductImageProps {
  image?: ProductImageData;
  /** Rendered width hint for responsive images, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Square product photo, or a neutral placeholder when there is none yet. */
export function ProductImage({ image, sizes, priority = false, className = "" }: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900",
        className,
      )}
    >
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-4"
        />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className="absolute inset-0 m-auto h-1/3 w-1/3 text-zinc-300 dark:text-zinc-700"
        >
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      )}
    </div>
  );
}
