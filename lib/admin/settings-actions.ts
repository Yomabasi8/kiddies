"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin, requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { NIGERIAN_STATES } from "@/lib/delivery";
import { DELIVERY_TAG } from "@/lib/delivery-data";
import { SETTINGS_TAG } from "@/lib/store-settings";

export type SettingsResult = { ok: true; message: string } | { ok: false; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https:\/\/[^\s]+$/i;
const clean = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export async function saveBusinessInfo(input: Record<string, string>): Promise<SettingsResult> {
  const actor = await requireAdmin();
  const email = clean(input.email, 254);
  if (!clean(input.store_name)) return { ok: false, message: "Enter the store name." };
  if (email && !EMAIL.test(email)) return { ok: false, message: "Enter a valid business email." };
  const socials: Record<string, string> = {};
  for (const k of ["instagram", "facebook", "tiktok", "x"]) {
    const v = clean(input[k], 300);
    if (v && !URL_RE.test(v)) return { ok: false, message: `The ${k} link must start with https://` };
    if (v) socials[k] = v;
  }
  const { error } = await createAdminClient()
    .from("store_settings")
    .update({
      store_name: clean(input.store_name, 80),
      email: email || null,
      phone: clean(input.phone, 30) || null,
      whatsapp: clean(input.whatsapp, 30) || null,
      address: clean(input.address, 300) || null,
      socials,
    })
    .eq("id", 1);
  if (error) return { ok: false, message: "Couldn't save business details." };
  await audit(actor, "settings.business", "store_settings", "1");
  updateTag(SETTINGS_TAG);
  revalidatePath("/admin/settings");
  return { ok: true, message: "Business details saved." };
}

export async function saveNotifications(input: Record<string, boolean>): Promise<SettingsResult> {
  const actor = await requireAdmin();
  const keys = ["notify_new_orders", "notify_payments", "notify_low_stock", "notify_order_status"] as const;
  const row = Object.fromEntries(keys.map((k) => [k, !!input[k]]));
  const { error } = await createAdminClient().from("store_settings").update(row).eq("id", 1);
  if (error) return { ok: false, message: "Couldn't save notification settings." };
  await audit(actor, "settings.notifications", "store_settings", "1", row);
  return { ok: true, message: "Notification preferences saved." };
}

export type DeliveryInput = { id?: string; label: string; description: string; fee: string; states: string[] | null; isActive: boolean; sortOrder: string };

export async function saveDeliveryMethod(input: DeliveryInput): Promise<SettingsResult> {
  const actor = await requireAdmin();
  const label = clean(input.label, 80);
  const feeNaira = clean(input.fee).replace(/[,\s₦]/g, "");
  const states = input.states === null ? null : input.states.filter((s) => (NIGERIAN_STATES as readonly string[]).includes(s));
  if (label.length < 2) return { ok: false, message: "Enter a name for this delivery option." };
  if (!/^\d+(\.\d{1,2})?$/.test(feeNaira)) return { ok: false, message: "Enter the delivery fee in Naira (0 for free)." };
  if (states !== null && states.length === 0) return { ok: false, message: "Choose at least one state, or make it nationwide." };
  const row = {
    label,
    description: clean(input.description, 120),
    fee: Math.round(Number(feeNaira) * 100),
    states,
    is_active: !!input.isActive,
    sort_order: Number(input.sortOrder) || 0,
  };
  const db = createAdminClient();
  const id = input.id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const { error } = input.id ? await db.from("delivery_methods").update(row).eq("id", input.id) : await db.from("delivery_methods").insert({ id, ...row });
  if (error) return { ok: false, message: error.code === "23505" ? "A delivery option with this name already exists." : "Couldn't save the delivery option." };
  await audit(actor, input.id ? "delivery.update" : "delivery.create", "delivery_method", id, { fee: row.fee, active: row.is_active });
  updateTag(DELIVERY_TAG);
  revalidatePath("/admin/settings");
  return { ok: true, message: "Delivery option saved." };
}

/** Sign this staff member out on every device. */
export async function signOutEverywhere() {
  await requireStaff();
  const supabase = await createSessionClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
