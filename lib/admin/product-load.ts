import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductFormValues } from "./product-types";

const naira = (kobo: number | null) => (kobo === null ? "" : String(kobo / 100));

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "", slug: "", description: "", categoryId: "", productType: "", sku: "",
  ageRange: "", material: "", capacityMl: "", dimensions: "", pieceCount: "", careInstructions: "",
  specs: [], images: [], price: "", salePrice: "",
  trackInventory: true, stock: "0", lowStockThreshold: "5",
  isFeatured: false, isNew: true, status: "draft",
};

export async function loadProductForm(id: string): Promise<ProductFormValues | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: p } = await createAdminClient()
    .from("products")
    .select("*, product_images(url, alt, image_style, is_primary, sort_order), inventory(quantity, variant_id)")
    .eq("id", id)
    .maybeSingle();
  if (!p) return null;
  type Img = { url: string; alt: string; image_style: "cutout" | "photo"; is_primary: boolean; sort_order: number };
  const images = [...((p.product_images ?? []) as Img[])].sort((a, b) => a.sort_order - b.sort_order);
  const stock = ((p.inventory ?? []) as { quantity: number; variant_id: string | null }[]).find((i) => !i.variant_id)?.quantity ?? 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    categoryId: p.category_id,
    productType: p.product_type ?? "",
    sku: p.sku,
    ageRange: p.age_range ?? "",
    material: p.material ?? "",
    capacityMl: p.capacity_ml ? String(p.capacity_ml) : "",
    dimensions: p.dimensions ?? "",
    pieceCount: p.piece_count ? String(p.piece_count) : "",
    careInstructions: p.care_instructions ?? "",
    specs: Array.isArray(p.specs) ? p.specs : [],
    images: images.map((i) => ({ url: i.url, alt: i.alt, style: i.image_style, isPrimary: i.is_primary })),
    price: naira(p.price),
    salePrice: naira(p.sale_price),
    trackInventory: p.track_inventory,
    stock: String(stock),
    lowStockThreshold: String(p.low_stock_threshold),
    isFeatured: p.is_featured,
    isNew: p.is_new,
    status: p.status,
  };
}

export async function loadCategoryOptions() {
  const { data } = await createAdminClient().from("categories").select("id, name").is("archived_at", null).order("sort_order");
  return data ?? [];
}
