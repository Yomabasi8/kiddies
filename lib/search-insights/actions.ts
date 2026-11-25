"use server";

import { searchProducts } from "@/lib/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

/** Lower-case, trim and collapse spaces so "Baby  Bottle" and "baby bottle" group together. */
const normalise = (q: string) => q.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);

/**
 * Record a shop search (query text + result count only; nothing that
 * identifies the shopper). The result count is recomputed here so it
 * can't be faked from the browser.
 *
 * TODO(launch): add per-IP rate limiting to keep the log clean.
 */
export async function logSearch(rawQuery: string): Promise<void> {
  const query = normalise(String(rawQuery ?? ""));
  if (query.length < 2) return;
  try {
    const { total } = await searchProducts({ q: query, page: 1 });
    await createAdminClient().from("search_queries").insert({ query, results_count: total });
  } catch {
    // Insights are best-effort; never break shopping over them.
  }
}
