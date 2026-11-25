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
  /** Launch offer: free delivery on every order until this time. */
  free_delivery_until: string | null;
};

/** Public store details (contact info, socials) for the storefront. */
export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const { data } = await createPublicClient()
    .from("store_settings")
    .select("store_name, logo_url, email, phone, whatsapp, address, socials, free_delivery_until")
    .eq("id", 1)
    .maybeSingle();
  return (data as StoreSettings | null) ?? { store_name: "Kiddies Accessories", logo_url: null, email: null, phone: null, whatsapp: null, address: null, socials: {}, free_delivery_until: null };
}
