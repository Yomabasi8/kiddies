import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export type CouponLine = { productId: string; categoryId: string; unitPrice: number; quantity: number };

export type CouponCheck =
  | { ok: true; couponId: string; code: string; discount: number; description: string }
  | { ok: false; message: string };

/**
 * Validate a coupon against a server-priced cart. Used both for the checkout
 * preview and again when the order is placed, so the client never decides
 * the discount. Usage limits count recorded redemptions (paid orders).
 */
export async function checkCoupon(rawCode: string, lines: CouponLine[], email: string | null): Promise<CouponCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { ok: false, message: "That coupon code isn't valid." };

  const db = createAdminClient();
  const { data: c } = await db
    .from("coupons")
    .select("id, code, description, discount_type, value, min_subtotal, scope, starts_at, ends_at, usage_limit, per_customer_limit, is_active, coupon_products(product_id), coupon_categories(category_id)")
    .eq("code", code)
    .maybeSingle();
  const invalid: CouponCheck = { ok: false, message: "That coupon code isn't valid." };
  if (!c || !c.is_active) return invalid;

  const now = Date.now();
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { ok: false, message: "That coupon isn't active yet." };
  if (c.ends_at && new Date(c.ends_at).getTime() <= now) return { ok: false, message: "That coupon has expired." };

  if (c.usage_limit) {
    const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", c.id);
    if ((count ?? 0) >= c.usage_limit) return { ok: false, message: "That coupon has reached its usage limit." };
  }
  if (c.per_customer_limit && email) {
    const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", c.id).ilike("email", email);
    if ((count ?? 0) >= c.per_customer_limit) return { ok: false, message: "You've already used this coupon." };
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  if (subtotal < c.min_subtotal) {
    return { ok: false, message: `Spend at least ${formatPrice(c.min_subtotal)} to use this coupon.` };
  }

  const productIds = new Set((c.coupon_products ?? []).map((x: { product_id: string }) => x.product_id));
  const categoryIds = new Set((c.coupon_categories ?? []).map((x: { category_id: string }) => x.category_id));
  const eligible = lines
    .filter((l) => c.scope === "all" || (c.scope === "products" && productIds.has(l.productId)) || (c.scope === "categories" && categoryIds.has(l.categoryId)))
    .reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  if (eligible === 0) return { ok: false, message: "This coupon doesn't apply to the items in your cart." };

  const discount = c.discount_type === "percent" ? Math.floor((eligible * c.value) / 100) : Math.min(c.value, eligible);
  const description =
    c.discount_type === "percent" ? `${c.value}% off${c.scope === "all" ? "" : " selected items"}` : `${formatPrice(c.value)} off`;
  return { ok: true, couponId: c.id, code: c.code, discount, description };
}
