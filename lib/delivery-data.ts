import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { DeliveryMethod } from "./delivery";

export const DELIVERY_TAG = "delivery";

type Row = { id: string; label: string; description: string; fee: number; states: string[] | null; is_pickup: boolean };

/**
 * Active delivery methods. Pickup is only offered once the store has a
 * pickup address. Fees here are the normal fees: the launch free-delivery
 * offer is applied with chargeFor() at the moment of use.
 */
async function load(): Promise<DeliveryMethod[]> {
  const db = createPublicClient();
  const [methods, settings] = await Promise.all([
    db.from("delivery_methods").select("id, label, description, fee, states, is_pickup").eq("is_active", true).order("sort_order"),
    db.from("store_settings").select("pickup_address, pickup_hours").eq("id", 1).maybeSingle(),
  ]);
  if (methods.error) throw new Error(`Loading delivery methods failed: ${methods.error.message}`);
  const pickupAddress = settings.data?.pickup_address?.trim() || null;
  return (methods.data as Row[])
    .filter((r) => !r.is_pickup || pickupAddress)
    .map((r) => ({
      id: r.id,
      label: r.label,
      description: r.description,
      fee: r.fee,
      states: r.states,
      isPickup: r.is_pickup,
      pickupAddress: r.is_pickup ? pickupAddress : null,
      pickupHours: r.is_pickup ? settings.data?.pickup_hours?.trim() || null : null,
    }));
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

/** Uncached length of the new-customer free-delivery offer (0 = off). */
export async function getFreeDeliveryDaysFresh(): Promise<number> {
  const { data } = await createPublicClient().from("store_settings").select("free_delivery_first_days").eq("id", 1).maybeSingle();
  return data?.free_delivery_first_days ?? 0;
}
