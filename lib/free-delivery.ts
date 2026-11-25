import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Last 10 digits, so 0803…, +234803… and 234803… all match. */
export const phoneKey = (p: string | null | undefined) => (p ?? "").replace(/\D/g, "").slice(-10);

/**
 * Is this customer in their first month of shopping with us? Their month
 * starts at their first PAID order, matched by email OR phone, so a new
 * email with the same phone doesn't restart it. No paid orders yet = yes.
 */
export async function isInFirstMonth(email: string | null, phone: string | null, days: number): Promise<boolean> {
  if (days <= 0) return false;
  const p = phoneKey(phone);
  const { data, error } = await createAdminClient().rpc("first_paid_order_at", {
    p_email: email?.trim().toLowerCase() || null,
    p_phone: p.length === 10 ? p : null,
  });
  if (error) throw new Error(`Free-delivery check failed: ${error.message}`);
  if (!data) return true;
  return Date.now() - new Date(data as string).getTime() < days * 86_400_000;
}
