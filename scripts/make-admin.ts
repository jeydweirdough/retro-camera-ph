/**
 * Gives (or removes) admin access for a signed-up user.
 *
 *   npm run make-admin -- owner@example.com
 *   npm run make-admin -- owner@example.com --remove
 */
import { Client } from "pg";

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npm run make-admin -- <email> [--remove]");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const role = flag === "--remove" ? "user" : "admin";
const result = await client.query(
  `update neon_auth."user" set role = $1, "updatedAt" = now() where lower(email) = lower($2) returning email`,
  [role, email],
);
await client.end();

if (result.rowCount === 0) {
  console.error(`No account for ${email}. Sign up on the site first, then run this again.`);
  process.exit(1);
}
console.log(`${result.rows[0].email} is now ${role === "admin" ? "an admin" : "a regular user"}.`);
