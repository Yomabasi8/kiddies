"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CouponFormValues } from "./coupon-types";

export type CouponFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<keyof CouponFormValues, string>> };

const int = (s: string) => (s.trim() === "" ? null : /^\d+$/.test(s.trim()) ? Number(s.trim()) : NaN);
const kobo = (s: string) => {
  const t = s.replace(/[,\s₦]/g, "");
  if (!t) return null;
  return /^\d+(\.\d{1,2})?$/.test(t) ? Math.round(Number(t) * 100) : NaN;
};
/** datetime-local is in the browser's local time; the store runs on WAT (UTC+1). */
const toIso = (s: string) => (s ? new Date(`${s}:00+01:00`).toISOString() : null);

export async function saveCoupon(_prev: CouponFormState, fd: FormData): Promise<CouponFormState> {
  const actor = await requireStaff();
  let v: CouponFormValues;
  try {
    v = JSON.parse(String(fd.get("payload") ?? ""));
  } catch {
    return { status: "error", message: "Couldn't read the form.", fieldErrors: {} };
  }
  const e: Partial<Record<keyof CouponFormValues, string>> = {};
  const code = v.code.trim().toUpperCase();
  const value = v.discountType === "percent" ? int(v.value) : kobo(v.value);
  const min = kobo(v.minSubtotal) ?? 0;
  const usage = int(v.usageLimit);
  const perCustomer = int(v.perCustomerLimit);
  const starts = toIso(v.startsAt);
  const ends = toIso(v.endsAt);

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) e.code = "3–32 letters, numbers, dashes or underscores.";
  if (value === null || Number.isNaN(value) || value <= 0) e.value = v.discountType === "percent" ? "Enter a percentage, e.g. 10." : "Enter an amount, e.g. 2000.";
  else if (v.discountType === "percent" && value > 100) e.value = "A percentage can't be more than 100.";
  if (Number.isNaN(min)) e.minSubtotal = "Enter an amount or leave blank.";
  if (usage !== null && (Number.isNaN(usage) || usage <= 0)) e.usageLimit = "Enter a whole number or leave blank.";
  if (perCustomer !== null && (Number.isNaN(perCustomer) || perCustomer <= 0)) e.perCustomerLimit = "Enter a whole number or leave blank.";
  if (starts && ends && ends <= starts) e.endsAt = "The end must be after the start.";
  if (v.scope === "products" && v.productIds.length === 0) e.productIds = "Choose at least one product.";
  if (v.scope === "categories" && v.categoryIds.length === 0) e.categoryIds = "Choose at least one category.";
  if (Object.keys(e).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: e };

  const db = createAdminClient();
  const row = {
    code,
    description: v.description.trim() || null,
    discount_type: v.discountType,
    value: value!,
    min_subtotal: min,
    scope: v.scope,
    starts_at: starts,
    ends_at: ends,
    usage_limit: usage,
    per_customer_limit: perCustomer,
    is_active: !!v.isActive,
  };
  const res = v.id ? await db.from("coupons").update(row).eq("id", v.id).select("id").single() : await db.from("coupons").insert(row).select("id").single();
  if (res.error) {
    if (res.error.code === "23505") return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { code: "This code already exists." } };
    return { status: "error", message: "Couldn't save the coupon.", fieldErrors: {} };
  }
  const id = res.data.id as string;

  // Replace scope links.
  await db.from("coupon_products").delete().eq("coupon_id", id);
  await db.from("coupon_categories").delete().eq("coupon_id", id);
  if (v.scope === "products") await db.from("coupon_products").insert(v.productIds.map((product_id) => ({ coupon_id: id, product_id })));
  if (v.scope === "categories") await db.from("coupon_categories").insert(v.categoryIds.map((category_id) => ({ coupon_id: id, category_id })));

  await audit(actor, v.id ? "coupon.update" : "coupon.create", "coupon", id, { code, active: row.is_active });
  redirect(`/admin/promotions?saved=${encodeURIComponent(code)}`);
}

export async function setCouponActive(id: string, active: boolean) {
  const actor = await requireStaff();
  await createAdminClient().from("coupons").update({ is_active: active }).eq("id", id);
  await audit(actor, active ? "coupon.activate" : "coupon.deactivate", "coupon", id);
  revalidatePath("/admin/promotions");
}
