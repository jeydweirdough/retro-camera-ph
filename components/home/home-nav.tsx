import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CurrencySelect } from "@/components/currency/currency-select";
import { getCurrentUser } from "@/lib/auth/session";
import { readCart } from "@/lib/cart/cart-cookie";
import { CATEGORIES } from "@/lib/domain/categories";
import { HomeMenu } from "./home-menu";

const circle =
  "relative grid size-9 place-items-center rounded-full border border-black/15 transition-colors hover:bg-black hover:text-white";

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function CartButton({ count }: { count?: number }) {
  return (
    <Link href="/cart" className={circle}>
      <BagIcon />
      <span className="sr-only">Cart</span>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-[#ee6a1c] px-1 text-[10px] leading-4 text-white tabular-nums">
          {count}
          <span className="sr-only"> {count === 1 ? "item" : "items"}</span>
        </span>
      )}
    </Link>
  );
}

async function CartWithCount() {
  const cart = await readCart();
  return <CartButton count={cart.itemCount} />;
}

async function AccountButton() {
  const user = await getCurrentUser();
  return (
    <Link href={user ? "/account" : "/auth/sign-in"} className={circle}>
      <UserIcon />
      <span className="sr-only">{user ? "Account" : "Sign in"}</span>
    </Link>
  );
}

function AccountFallback() {
  return (
    <Link href="/account" className={circle}>
      <UserIcon />
      <span className="sr-only">Account</span>
    </Link>
  );
}

/** The hero mockup's top bar: Menu + Search · logo · currency, cart, account. */
export function HomeNav() {
  const links = [
    { href: "/shop", label: "Shop all" },
    ...Object.values(CATEGORIES).map((category) => ({ href: `/shop/${category.slug}`, label: category.label })),
  ];

  return (
    <header className="relative z-40 flex items-center justify-between gap-4 border-b border-black/10 pb-5">
      <div className="flex items-center gap-2 sm:gap-5">
        <HomeMenu links={links} />
        <Link href="/shop" className="hidden items-center gap-2 text-xs transition-opacity hover:opacity-60 sm:flex">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          Search
        </Link>
      </div>

      <Link
        href="/"
        className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-sm font-semibold tracking-tight"
      >
        <Image src="/brand/logo-96.png" alt="" width={28} height={28} unoptimized priority className="rounded-md" />
        <span className="hidden sm:inline">
          Retro Camera <span className="text-[#ee6a1c]">PH</span>
        </span>
        <span className="sr-only sm:hidden">Retro Camera PH home</span>
      </Link>

      <div className="flex items-center gap-2 [&_select]:h-9 [&_select]:rounded-full [&_select]:border-transparent [&_select]:bg-transparent [&_select]:text-xs">
        <div className="hidden sm:block">
          <CurrencySelect />
        </div>
        <Suspense fallback={<CartButton />}>
          <CartWithCount />
        </Suspense>
        <Suspense fallback={<AccountFallback />}>
          <AccountButton />
        </Suspense>
      </div>
    </header>
  );
}
