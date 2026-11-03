"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { Input } from "@/components/ui/input/input";
import { signIn, signUp } from "@/lib/auth/actions";

const MODES = {
  "sign-in": {
    action: signIn,
    submit: "Sign in",
    switchText: "New here?",
    switchLabel: "Create an account",
    switchPath: "/auth/sign-up",
  },
  "sign-up": {
    action: signUp,
    submit: "Create account",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchPath: "/auth/sign-in",
  },
} as const;

/** One form for both sign-in and sign-up; only the fields and action differ. */
export function AuthForm({ mode }: { mode: keyof typeof MODES }) {
  const config = MODES[mode];
  const [result, action] = useActionState(config.action, null);
  const next = useSearchParams().get("next") ?? "";
  const keepNext = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {mode === "sign-up" && <Input name="name" label="Full name" autoComplete="name" required />}
      <Input name="email" type="email" label="Email" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        hint={mode === "sign-up" ? "At least 8 characters." : undefined}
        minLength={mode === "sign-up" ? 8 : undefined}
        required
      />

      <p role="alert" className="min-h-5 text-sm text-red-600">
        {result?.message}
      </p>

      <SubmitButton size="lg">{config.submit}</SubmitButton>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {config.switchText}{" "}
        <Link href={`${config.switchPath}${keepNext}`} className="font-medium text-brand-700 underline dark:text-brand-400">
          {config.switchLabel}
        </Link>
      </p>
    </form>
  );
}
