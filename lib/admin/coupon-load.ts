import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_COUPON, type CouponFormValues } from "./coupon-types";

/** ISO → "YYYY-MM-DDTHH:mm" in Nigeria time (UTC+1) for datetime-local inputs. */
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 16) : "");

export async function loadCouponOptions() {
  const db = createAdminClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    db.from("products").select("id, name").neq("status", "archived").order("name"),
    db.from("categories").select("id, name").is("archived_at", null).order("sort_order"),
  ]);
  return { products: products ?? [], categories: categories ?? [] };
}

export async function loadCoupon(id: string): Promise<CouponFormValues | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: c } = await createAdminClient()
    .from("coupons")
    .select("*, coupon_products(product_id), coupon_categories(category_id)")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;
  return {
    ...EMPTY_COUPON,
    id: c.id,
    code: c.code,
    description: c.description ?? "",
    discountType: c.discount_type,
    value: c.discount_type === "percent" ? String(c.value) : String(c.value / 100),
    minSubtotal: c.min_subtotal ? String(c.min_subtotal / 100) : "",
    scope: c.scope,
    productIds: (c.coupon_products ?? []).map((x: { product_id: string }) => x.product_id),
    categoryIds: (c.coupon_categories ?? []).map((x: { category_id: string }) => x.category_id),
    startsAt: toLocal(c.starts_at),
    endsAt: toLocal(c.ends_at),
    usageLimit: c.usage_limit ? String(c.usage_limit) : "",
    perCustomerLimit: c.per_customer_limit ? String(c.per_customer_limit) : "",
    isActive: c.is_active,
  };
}
