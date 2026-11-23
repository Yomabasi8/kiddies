import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client using the publishable key. Row Level Security
 * limits it to public catalogue data (active products, visible categories,
 * delivery methods). Safe inside `'use cache'` scopes because it never reads
 * request data.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
