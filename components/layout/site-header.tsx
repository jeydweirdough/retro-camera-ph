import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, AccountLinkFallback } from "@/components/auth/account-link";
import { CartLink, CartLinkFallback } from "@/components/cart/cart-link";
import { CurrencySelect } from "@/components/currency/currency-select";
import { CATEGORIES } from "@/lib/domain/categories";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          {/* Pre-resized file, so skip the image loader (it's for Sanity photos). */}
          <Image src="/brand/logo-96.png" alt="" width={48} height={48} unoptimized priority className="rounded-lg" />
          {site.name}
        </Link>

        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-brand-700 dark:hover:text-brand-400">
                Shop all
              </Link>
            </li>
            {Object.values(CATEGORIES).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop/${category.slug}`}
                  className="hover:text-brand-700 dark:hover:text-brand-400"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <CurrencySelect />
          <Suspense fallback={<AccountLinkFallback />}>
            <AccountLink />
          </Suspense>
          <Suspense fallback={<CartLinkFallback />}>
            <CartLink />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
