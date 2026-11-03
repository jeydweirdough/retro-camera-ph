import { auth } from "@/lib/auth/server";

/** Signed-out visitors to these pages are sent to sign in first. */
export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/checkout/:path*", "/account/:path*", "/admin/:path*"],
};
