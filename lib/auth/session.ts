
import { sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/lib/db/client";
import { auth } from "./server";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  await connection();

  const { data } = await auth.getSession();
  const user = data?.user;

  return user
    ? { id: user.id, name: user.name, email: user.email }
    : null;
}

export function safeNextPath(next: unknown, fallback = "/account") {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//")
    ? next
    : fallback;
}

export async function requireUser(
  returnTo: string,
): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(returnTo)}`,
    );
  }

  return user;
}

export async function isAdmin(userId: string) {
  const result = await getDb().execute<{ role: string | null }>(
    sql`select role from neon_auth."user" where id = ${userId} and banned is not true`,
  );

  return result.rows[0]?.role === "admin";
}

export async function currentAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();

  return user && (await isAdmin(user.id)) ? user : null;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");

  if (!(await isAdmin(user.id))) {
    notFound();
  }

  return user;
}
