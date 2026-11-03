import Link from "next/link";
import { CATEGORIES } from "@/lib/domain/categories";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:justify-between">
        <p>
          {site.name} · Prices in Philippine pesos (₱) · Pay by QR code
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {Object.values(CATEGORIES).map((category) => (
            <li key={category.slug}>
              <Link href={`/shop/${category.slug}`} className="hover:text-zinc-900 dark:hover:text-zinc-100">
                {category.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={site.social.facebook}
              rel="me noopener"
              target="_blank"
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Facebook<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
