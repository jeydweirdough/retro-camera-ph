"use server";

import { redirect } from "next/navigation";
import { auth } from "./server";
import { safeNextPath } from "./session";

export interface AuthResult {
  message: string;
}

const MIN_PASSWORD = 8;

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export async function signIn(_previous: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const { error } = await auth.signIn.email({
    email: field(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  // Same message either way, so the form doesn't reveal which emails have accounts.
  if (error) return { message: "Wrong email or password." };
  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_previous: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!name) return { message: "Enter your name." };
  if (password.length < MIN_PASSWORD) {
    return { message: `Use a password of at least ${MIN_PASSWORD} characters.` };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) return { message: error.message || "Could not create your account. Please try again." };
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut() {
  await auth.signOut();
  redirect("/");
}
