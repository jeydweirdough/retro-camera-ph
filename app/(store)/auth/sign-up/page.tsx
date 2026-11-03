import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card/card";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default function Page() {
  return (
    <Card className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      {/* The form reads ?next= from the URL, which isn't known until request time. */}
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </Card>
  );
}
