import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { DeliveryMethod } from "./delivery";

export const DELIVERY_TAG = "delivery";

type Row = { id: string; label: string; description: string; fee: number; states: string[] | null };

async function load(): Promise<DeliveryMethod[]> {
  const { data, error } = await createPublicClient()
    .from("delivery_methods")
    .select("id, label, description, fee, states")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Loading delivery methods failed: ${error.message}`);
  return (data as Row[]).map((r) => ({ ...r, states: r.states }));
}

/** Cached, for display (checkout options, shipping policy). */
export async function getDeliveryMethods(): Promise<DeliveryMethod[]> {
  "use cache";
  cacheTag(DELIVERY_TAG);
  cacheLife("hours");
  return load();
}

/** Uncached, for pricing an order on the server. */
export async function getDeliveryMethodsFresh(): Promise<DeliveryMethod[]> {
  return load();
}
