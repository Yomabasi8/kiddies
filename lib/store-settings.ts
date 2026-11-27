import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const SETTINGS_TAG = "store-settings";

export type StoreSettings = {
  store_name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  socials: { instagram?: string; facebook?: string; tiktok?: string; x?: string };
  /** Free delivery for this many days from a customer's first paid order (0 = off). */
  free_delivery_first_days: number;
  /** While true the storefront shows the maintenance page and checkout is refused. */
  store_closed: boolean;
  closed_message: string | null;
  /** YYYY-MM-DD, optional. */
  reopens_on: string | null;
};

/** Public store details (contact info, socials) for the storefront. */
export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const { data } = await createPublicClient()
    .from("store_settings")
    .select("store_name, logo_url, email, phone, whatsapp, address, socials, free_delivery_first_days, store_closed, closed_message, reopens_on")
    .eq("id", 1)
    .maybeSingle();
  return (data as StoreSettings | null) ?? { store_name: "Kiddies Accessories", logo_url: null, email: null, phone: null, whatsapp: null, address: null, socials: {}, free_delivery_first_days: 0, store_closed: false, closed_message: null, reopens_on: null };
}
