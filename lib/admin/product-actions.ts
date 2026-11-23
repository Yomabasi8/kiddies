"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { audit, requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { PRODUCT_TYPES, buildSkuBase, slugify, type ProductFormValues } from "./product-types";

export type ProductFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<keyof ProductFormValues | "form", string>> };

const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/`;
const isAllowedImage = (url: string) => url.startsWith(STORAGE_PREFIX) || /^\/images\/[\w\-/]+\.(png|jpe?g|webp|avif)$/.test(url);

/** "12,500" / "12500.50" → kobo, or null when blank. NaN when invalid. */
function toKobo(v: string): number | null {
  const s = v.replace(/[,\s₦]/g, "");
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100);
}
function toInt(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  return /^\d+$/.test(s) ? Number(s) : NaN;
}

export async function saveProduct(_prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  const actor = await requireStaff();
  let v: ProductFormValues;
  try {
    v = JSON.parse(String(fd.get("payload") ?? ""));
  } catch {
    return { status: "error", message: "Couldn't read the form. Please try again.", fieldErrors: {} };
  }
  const intent = fd.get("intent") === "publish" ? "active" : fd.get("intent") === "draft" ? "draft" : v.status;

  // ---- Validation -----------------------------------------------------
  const e: Partial<Record<keyof ProductFormValues | "form", string>> = {};
  const name = v.name?.trim() ?? "";
  const slug = slugify(v.slug?.trim() || name);
  const sku = v.sku?.trim().toUpperCase() ?? "";
  const price = toKobo(v.price ?? "");
  const salePrice = toKobo(v.salePrice ?? "");
  const stock = toInt(v.stock ?? "");
  const threshold = toInt(v.lowStockThreshold ?? "");
  const capacity = toInt(v.capacityMl ?? "");
  const pieces = toInt(v.pieceCount ?? "");

  if (name.length < 2 || name.length > 160) e.name = "Enter a product name (2–160 characters).";
  if (!slug) e.slug = "Enter a URL name using letters and numbers.";
  if (!v.categoryId) e.categoryId = "Choose a category.";
  if (!PRODUCT_TYPES.some((t) => t.value === v.productType)) e.productType = "Choose a product type.";
  if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(sku)) e.sku = "SKU: 2–40 letters, numbers or dashes.";
  if (price === null || Number.isNaN(price) || price <= 0) e.price = "Enter a selling price, e.g. 12500.";
  if (salePrice !== null && (Number.isNaN(salePrice) || salePrice <= 0)) e.salePrice = "Enter a valid discount price or leave it blank.";
  else if (salePrice !== null && price && salePrice >= price) e.salePrice = "The discount price must be lower than the selling price.";
  if (v.trackInventory && (stock === null || Number.isNaN(stock))) e.stock = "Enter the stock quantity (0 or more).";
  if (threshold !== null && Number.isNaN(threshold)) e.lowStockThreshold = "Enter a whole number.";
  if (capacity !== null && (Number.isNaN(capacity) || capacity <= 0)) e.capacityMl = "Enter capacity in ml, e.g. 260.";
  if (pieces !== null && (Number.isNaN(pieces) || pieces <= 0)) e.pieceCount = "Enter the number of pieces.";
  if ((v.description ?? "").length > 5000) e.description = "Keep the description under 5,000 characters.";
  const images = (v.images ?? []).filter((i) => i.url);
  if (images.some((i) => !isAllowedImage(i.url))) e.images = "One of the images isn't from the product image store.";
  if (intent === "active" && images.length === 0) e.images = "Add at least one image before publishing.";
  const specs = (v.specs ?? [])
    .map((s) => ({ label: s.label.trim().slice(0, 40), value: s.value.trim().slice(0, 120) }))
    .filter((s) => s.label && s.value)
    .slice(0, 20);

  if (Object.keys(e).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: e };

  // ---- Persist ----------------------------------------------------------
  const db = createAdminClient();
  const row = {
    name,
    slug,
    sku,
    description: v.description?.trim() ?? "",
    category_id: v.categoryId,
    product_type: v.productType,
    price: price!,
    sale_price: salePrice,
    age_range: v.ageRange?.trim() || null,
    material: v.material?.trim() || null,
    capacity_ml: capacity,
    dimensions: v.dimensions?.trim() || null,
    piece_count: pieces,
    care_instructions: v.careInstructions?.trim() || null,
    specs,
    track_inventory: !!v.trackInventory,
    low_stock_threshold: threshold ?? 5,
    is_featured: !!v.isFeatured,
    is_new: !!v.isNew,
    status: intent,
    archived_at: intent === "archived" ? new Date().toISOString() : null,
  };

  let id = v.id;
  let previousStatus: string | null = null;
  if (id) {
    const { data: existing } = await db.from("products").select("status, published_at").eq("id", id).maybeSingle();
    if (!existing) return { status: "error", message: "This product no longer exists.", fieldErrors: {} };
    previousStatus = existing.status;
    const { error } = await db
      .from("products")
      .update({ ...row, published_at: intent === "active" ? existing.published_at ?? new Date().toISOString() : existing.published_at })
      .eq("id", id);
    if (error) return dbError(error);
  } else {
    const { data, error } = await db
      .from("products")
      .insert({ ...row, published_at: intent === "active" ? new Date().toISOString() : null })
      .select("id")
      .single();
    if (error) return dbError(error);
    id = data.id as string;
  }

  // Images: replace the set, keeping exactly one primary.
  const primaryIndex = Math.max(0, images.findIndex((i) => i.isPrimary));
  await db.from("product_images").delete().eq("product_id", id);
  if (images.length) {
    const { error } = await db.from("product_images").insert(
      images.map((img, i) => ({
        product_id: id,
        url: img.url,
        alt: (img.alt || name).slice(0, 200),
        image_style: img.style === "photo" ? "photo" : "cutout",
        is_primary: i === primaryIndex,
        sort_order: i,
      })),
    );
    if (error) return dbError(error);
  }

  // Stock: create the row, or record the difference as an adjustment.
  if (row.track_inventory && stock !== null) {
    const { data: inv } = await db.from("inventory").select("id, quantity").eq("product_id", id).is("variant_id", null).maybeSingle();
    if (!inv) {
      const { data: created, error } = await db.from("inventory").insert({ product_id: id, quantity: stock }).select("id").single();
      if (error) return dbError(error);
      if (stock > 0) {
        await db.from("inventory_movements").insert({ inventory_id: created.id, change: stock, quantity_after: stock, reason: "initial", note: "Set when product was created", created_by: actor.id });
      }
    } else if (inv.quantity !== stock) {
      const { error } = await db.rpc("adjust_stock", {
        p_inventory_id: inv.id,
        p_change: stock - inv.quantity,
        p_reason: "adjustment",
        p_note: "Updated in product form",
        p_actor: actor.id,
      });
      if (error) return dbError(error);
    }
  }

  await audit(actor, v.id ? "product.update" : "product.create", "product", id!, {
    name,
    status: intent,
    ...(previousStatus && previousStatus !== intent ? { previous_status: previousStatus } : {}),
  });
  updateTag(CATALOG_TAG);
  redirect(`/admin/products/${id}?saved=${intent === "active" ? "published" : "draft"}`);
}

function dbError(error: { code?: string; message: string; details?: string }): ProductFormState {
  if (error.code === "23505") {
    const field = /sku/.test(error.message + (error.details ?? "")) ? "sku" : "slug";
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: { [field]: field === "sku" ? "Another product already uses this SKU." : "Another product already uses this URL name." },
    };
  }
  return { status: "error", message: "Couldn't save the product. Please try again.", fieldErrors: {} };
}

/** Archive keeps the product (and order history) but hides it from the shop. */
export async function archiveProduct(id: string) {
  const actor = await requireStaff();
  await createAdminClient().from("products").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id);
  await audit(actor, "product.archive", "product", id);
  updateTag(CATALOG_TAG);
  redirect("/admin/products?archived=1");
}

/** Permanent delete, only allowed when no order references the product. */
export async function deleteProduct(id: string): Promise<{ ok: false; message: string } | never> {
  const actor = await requireStaff();
  const db = createAdminClient();
  const { count } = await db.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", id);
  if (count) {
    return { ok: false, message: "This product appears in past orders, so it can't be deleted. Archive it instead." };
  }
  const { data: product } = await db.from("products").select("name").eq("id", id).maybeSingle();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete the product. Please try again." };
  await audit(actor, "product.delete", "product", id, { name: product?.name });
  updateTag(CATALOG_TAG);
  redirect("/admin/products?deleted=1");
}

/**
 * Suggest a unique SKU from the product's name/type. Checks existing SKUs
 * and appends -2, -3… when the base is taken (ignoring the product itself).
 */
export async function generateSku(input: { name: string; productType: string; capacityMl?: string; productId?: string }) {
  await requireStaff();
  const base = buildSkuBase(input.name ?? "", input.productType ?? "", input.capacityMl);
  const { data } = await createAdminClient().from("products").select("id, sku").ilike("sku", `${base}%`);
  const taken = new Set((data ?? []).filter((r) => r.id !== input.productId).map((r) => r.sku.toUpperCase()));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}
