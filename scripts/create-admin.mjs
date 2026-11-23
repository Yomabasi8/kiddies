#!/usr/bin/env node
/**
 * Invite an admin (or staff) user.
 *
 *   npm run admin:create -- someone@example.com
 *   npm run admin:create -- someone@example.com --role staff
 *
 * Supabase emails them an invite link. They open it, land on
 * /admin/set-password, choose their own password, and can then sign in at
 * /admin/login. If the email already has an account, it's just promoted.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and
 * NEXT_PUBLIC_SITE_URL in .env.local. Prints no secrets.
 */
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const email = (process.argv[2] ?? "").trim().toLowerCase();
const roleFlag = process.argv.indexOf("--role");
const role = roleFlag > -1 ? process.argv[roleFlag + 1] : "admin";

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !["admin", "staff"].includes(role)) {
  console.error("Usage: npm run admin:create -- someone@example.com [--role admin|staff]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Existing account? Promote it instead of inviting.
let userId = null;
for (let page = 1; !userId; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Couldn't list users:", error.message);
    process.exit(1);
  }
  userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
  if (data.users.length < 200) break;
}

if (!userId) {
  const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${site}/admin/set-password`,
  });
  if (error) {
    console.error("Invite failed:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Invite email sent to ${email}.`);
} else {
  console.log(`${email} already has an account; updating its role.`);
}

const { error } = await db.from("profiles").upsert({ id: userId, role }, { onConflict: "id" });
if (error) {
  console.error("Couldn't set the role:", error.message);
  process.exit(1);
}
await db.from("audit_logs").insert({ action: "staff.role_granted", entity_type: "profile", entity_id: userId, details: { email, role, via: "create-admin script" } });

console.log(`Done: ${email} is now ${role}. They should open the email, set a password, then sign in at ${site}/admin/login`);
