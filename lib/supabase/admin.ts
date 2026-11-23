import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the SECRET key. It bypasses Row Level
 * Security, so use it only in server actions / route handlers after doing
 * your own validation and authorisation. Never import it into client code
 * (the `server-only` import above makes that a build error).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
