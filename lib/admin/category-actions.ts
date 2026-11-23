"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { audit, requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { slugify } from "./product-types";
import { CATEGORY_ACCENTS, CATEGORY_ICONS, type CategoryFormValues } from "./category-types";

export type CategoryFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<keyof CategoryFormValues, string>> };

const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/`;

export async function saveCategory(_prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  const actor = await requireStaff();
  let v: CategoryFormValues;
  try {
    v = JSON.parse(String(fd.get("payload") ?? ""));
  } catch {
    return { status: "error", message: "Couldn't read the form.", fieldErrors: {} };
  }
  const e: Partial<Record<keyof CategoryFormValues, string>> = {};
  const name = v.name?.trim() ?? "";
  const slug = slugify(v.slug || name);
  const sort = Number(v.sortOrder || 0);
  if (name.length < 2 || name.length > 80) e.name = "Enter a category name (2–80 characters).";
  if (!slug) e.slug = "Enter a URL name.";
  if (!CATEGORY_ICONS.includes(v.icon as (typeof CATEGORY_ICONS)[number])) e.icon = "Choose an icon.";
  if (!CATEGORY_ACCENTS.includes(v.accent as (typeof CATEGORY_ACCENTS)[number])) e.accent = "Choose a colour.";
  if (v.imageUrl && !v.imageUrl.startsWith(STORAGE_PREFIX) && !/^\/images\/[\w\-/]+\.(png|jpe?g|webp|avif)$/.test(v.imageUrl)) e.imageUrl = "Upload the image using the uploader.";
  if (!Number.isInteger(sort) || sort < 0 || sort > 1000) e.sortOrder = "Enter a whole number.";
  if (Object.keys(e).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: e };

  const row = {
    name,
    slug,
    description: v.description?.trim() || null,
    image_url: v.imageUrl || null,
    image_style: v.imageStyle === "photo" ? "photo" : "cutout",
    icon: v.icon,
    accent: v.accent,
    is_visible: !!v.isVisible,
    sort_order: sort,
  };
  const db = createAdminClient();
  const res = v.id ? await db.from("categories").update(row).eq("id", v.id).select("id").single() : await db.from("categories").insert(row).select("id").single();
  if (res.error) {
    if (res.error.code === "23505") return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: { slug: "Another category already uses this URL name." } };
    return { status: "error", message: "Couldn't save the category.", fieldErrors: {} };
  }
  await audit(actor, v.id ? "category.update" : "category.create", "category", res.data.id, { name, visible: row.is_visible });
  updateTag(CATALOG_TAG);
  redirect(`/admin/categories?saved=${encodeURIComponent(name)}`);
}

/**
 * Archive a category. If it still has products, they must be moved to
 * another category first (moveTo), so no product is left without one.
 */
export async function archiveCategory(id: string, moveTo: string | null): Promise<{ ok: false; message: string } | never> {
  const actor = await requireStaff();
  const db = createAdminClient();
  const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) {
    if (!moveTo || moveTo === id) return { ok: false, message: "Choose a category to move this category's products to." };
    const { data: target } = await db.from("categories").select("id").eq("id", moveTo).is("archived_at", null).maybeSingle();
    if (!target) return { ok: false, message: "That category isn't available." };
    const { error } = await db.from("products").update({ category_id: moveTo }).eq("category_id", id);
    if (error) return { ok: false, message: "Couldn't move the products." };
  }
  await db.from("categories").update({ archived_at: new Date().toISOString(), is_visible: false }).eq("id", id);
  await audit(actor, "category.archive", "category", id, { moved_products: count ?? 0, moved_to: moveTo });
  updateTag(CATALOG_TAG);
  redirect("/admin/categories?archived=1");
}

export async function restoreCategory(id: string) {
  const actor = await requireStaff();
  await createAdminClient().from("categories").update({ archived_at: null }).eq("id", id);
  await audit(actor, "category.restore", "category", id);
  updateTag(CATALOG_TAG);
  redirect(`/admin/categories/${id}`);
}
