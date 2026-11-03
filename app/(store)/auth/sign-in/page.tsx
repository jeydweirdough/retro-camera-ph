import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card/card";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Page() {
  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      {/* The form reads ?next= from the URL, which isn't known until request time. */}
      <Suspense>
        <AuthForm mode="sign-in" />
      </Suspense>
    </Card>
  );
}
