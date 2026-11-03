import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

const linkClass = "text-sm font-medium hover:text-brand-700 dark:hover:text-brand-400";

/** "Account" when signed in, "Sign in" otherwise. Reads cookies: render inside <Suspense>. */
export async function AccountLink() {
  const user = await getCurrentUser();
  return (
    <Link href={user ? "/account" : "/auth/sign-in"} className={linkClass}>
      {user ? "Account" : "Sign in"}
    </Link>
  );
}

export function AccountLinkFallback() {
  return (
    <Link href="/account" className={linkClass}>
      Account
    </Link>
  );
}
