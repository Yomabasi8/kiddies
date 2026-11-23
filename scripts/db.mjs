#!/usr/bin/env node
/**
 * Database tooling.
 *
 *   npm run db:migrate   Apply new files in supabase/migrations (in order).
 *   npm run db:status    List applied and pending migrations.
 *
 * Reads SUPABASE_DB_URL from .env.local. Each migration runs in a single
 * transaction and is recorded in internal.schema_migrations (a schema the
 * Data API does not expose). Connection details are never printed.
 */
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set (add it to .env.local).");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });
const dir = path.join(process.cwd(), "supabase", "migrations");

async function ensureTable() {
  await sql`create schema if not exists internal`;
  await sql`revoke all on schema internal from public, anon, authenticated`;
  await sql`
    create table if not exists internal.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
}

async function files() {
  return (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
}

async function applied() {
  const rows = await sql`select name from internal.schema_migrations`;
  return new Set(rows.map((r) => r.name));
}

async function migrate() {
  await ensureTable();
  const done = await applied();
  const pending = (await files()).filter((f) => !done.has(f));
  if (pending.length === 0) {
    console.log("Database is up to date.");
    return;
  }
  for (const name of pending) {
    const body = await readFile(path.join(dir, name), "utf8");
    process.stdout.write(`Applying ${name} … `);
    await sql.begin(async (tx) => {
      await tx.unsafe(body).simple();
      await tx`insert into internal.schema_migrations (name) values (${name})`;
    });
    console.log("done");
  }
}

async function status() {
  await ensureTable();
  const done = await applied();
  for (const f of await files()) console.log(`${done.has(f) ? "applied" : "PENDING"}  ${f}`);
}

const command = process.argv[2];
try {
  if (command === "migrate") await migrate();
  else if (command === "status") await status();
  else {
    console.error("Usage: node scripts/db.mjs <migrate|status>");
    process.exitCode = 1;
  }
} catch (err) {
  // Postgres errors don't include credentials; print message + position only.
  console.error("\nFailed:", err.message, err.position ? `(at character ${err.position})` : "");
  process.exitCode = 1;
} finally {
  await sql.end();
}
