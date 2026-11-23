import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Accent,
  Category,
  CategoryIconKey,
  CategoryWithCount,
  ImageStyle,
  Product,
  ProductDetail,
  ProductSpec,
  ShopQuery,
  ShopResult,
} from "./types";

/**
 * Catalogue data access, backed by Supabase.
 *
 * Reads are cached with the `catalog` tag; admin product/category/stock
 * changes call `revalidateTag("catalog")` / `updateTag("catalog")` so the
 * storefront refreshes immediately. Checkout uses `getProductsByIds`, which
 * is deliberately uncached so prices and stock are always current.
 *
 * Only active products and visible categories are returned (enforced by RLS
 * as well as the queries below).
 */

export const CATALOG_TAG = "catalog";
export const PAGE_SIZE = 12;

/** Materials offered as a shop filter, matched against product material. */
export const MATERIAL_FILTERS = ["Silicone", "Plastic", "Wood", "Plush", "Stainless steel", "Vinyl"];

/** "Suitable for" options: the child's age in months. */
export const AGE_FILTERS = [
  { label: "0–6 months", months: 0 },
  { label: "6–12 months", months: 6 },
  { label: "1–2 years", months: 12 },
  { label: "2–3 years", months: 24 },
  { label: "3 years+", months: 36 },
];

/** Parse "6m+" / "3y+" into months. */
export function minAgeMonths(ageRange: string | null): number {
  const m = ageRange?.match(/^(\d+)\s*([my])/i);
  if (!m) return 0;
  return Number(m[1]) * (m[2].toLowerCase() === "y" ? 12 : 1);
}

export const effectivePrice = (p: Product) => p.salePrice ?? p.price;

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------
const ICONS: CategoryIconKey[] = ["plate", "cutlery", "bottle", "cup", "bib", "lunchbox", "educational", "puzzle", "other"];
const ACCENTS: Accent[] = ["mint", "peach", "sky", "butter", "lilac", "blush"];

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  icon: string;
  accent: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  sku: string;
  price: number;
  sale_price: number | null;
  age_range: string | null;
  material: string | null;
  capacity_ml: number | null;
  dimensions: string | null;
  piece_count: number | null;
  care_instructions: string | null;
  specs: ProductSpec[] | null;
  is_featured: boolean;
  is_new: boolean;
  track_inventory: boolean;
  created_at: string;
  product_images: { url: string; alt: string; image_style: ImageStyle; is_primary: boolean; sort_order: number }[];
  inventory: { quantity: number; variant_id: string | null }[];
};

const PRODUCT_SELECT =
  "id, slug, name, description, category_id, sku, price, sale_price, age_range, material, capacity_ml, dimensions, piece_count, care_instructions, specs, is_featured, is_new, track_inventory, created_at, product_images(url, alt, image_style, is_primary, sort_order), inventory(quantity, variant_id)";

/** Products that don't track stock are always purchasable. */
const UNTRACKED_STOCK = 999;

function toCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    image: r.image_url,
    icon: (ICONS as string[]).includes(r.icon) ? (r.icon as CategoryIconKey) : "other",
    accent: (ACCENTS as string[]).includes(r.accent) ? (r.accent as Accent) : "mint",
  };
}

function toProduct(r: ProductRow): ProductDetail {
  const images = [...(r.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const primary = images.find((i) => i.is_primary) ?? images[0];
  const stock = r.track_inventory
    ? (r.inventory ?? []).filter((i) => i.variant_id === null).reduce((s, i) => s + i.quantity, 0)
    : UNTRACKED_STOCK;
  const specs: ProductSpec[] = [
    ...(r.piece_count ? [{ label: "Pieces", value: String(r.piece_count) }] : []),
    ...(r.capacity_ml ? [{ label: "Capacity", value: `${r.capacity_ml}ml` }] : []),
    ...(r.dimensions ? [{ label: "Dimensions", value: r.dimensions }] : []),
    ...(Array.isArray(r.specs) ? r.specs : []),
  ];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    categoryId: r.category_id,
    price: r.price,
    salePrice: r.sale_price,
    stock,
    image: primary?.url ?? null,
    imageStyle: primary?.image_style ?? "cutout",
    ageRange: r.age_range,
    material: r.material,
    isNew: r.is_new,
    isFeatured: r.is_featured,
    createdAt: r.created_at,
    sku: r.sku,
    description: r.description,
    gallery: images.filter((i) => i !== primary).map((i) => ({ src: i.url, alt: i.alt, style: i.image_style })),
    specs,
    careInstructions: r.care_instructions,
  };
}

/** Strip detail-only fields so client components receive a lean Product. */
function toSummary(p: ProductDetail): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryId: p.categoryId,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    image: p.image,
    imageStyle: p.imageStyle,
    ageRange: p.ageRange,
    material: p.material,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Cached catalogue snapshot
// ---------------------------------------------------------------------------
// TODO(scale): fine for hundreds of products. With thousands, move search,
// filtering and pagination into SQL instead of filtering this snapshot.
async function getCatalog(): Promise<{ categories: Category[]; products: ProductDetail[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const db = createPublicClient();
  const [cats, prods] = await Promise.all([
    db.from("categories").select("id, slug, name, image_url, icon, accent").order("sort_order"),
    db.from("products").select(PRODUCT_SELECT).eq("status", "active").order("created_at", { ascending: false }),
  ]);
  if (cats.error) throw new Error(`Loading categories failed: ${cats.error.message}`);
  if (prods.error) throw new Error(`Loading products failed: ${prods.error.message}`);

  const categories = (cats.data as CategoryRow[]).map(toCategory);
  const visible = new Set(categories.map((c) => c.id));
  const products = (prods.data as unknown as ProductRow[]).map(toProduct).filter((p) => visible.has(p.categoryId));
  return { categories, products };
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  const { categories, products } = await getCatalog();
  return categories.map((c) => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id).length }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { categories } = await getCatalog();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { products } = await getCatalog();
  return products
    .filter((p) => p.isFeatured)
    .sort((a, b) => Number(!!b.image) - Number(!!a.image))
    .slice(0, 12)
    .map(toSummary);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const { products } = await getCatalog();
  return products.map((p) => p.slug);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Same-category products first, then others, excluding the product itself. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { products } = await getCatalog();
  const others = products.filter((p) => p.id !== product.id && p.image);
  const same = others.filter((p) => p.categoryId === product.categoryId);
  const rest = others.filter((p) => p.categoryId !== product.categoryId);
  return [...same, ...rest].slice(0, limit).map(toSummary);
}

/**
 * Current products by id for checkout. UNCACHED on purpose: prices and stock
 * must be live when validating an order.
 */
export async function getProductsByIds(ids: string[]): Promise<Map<string, ProductDetail>> {
  const uuids = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (uuids.length === 0) return new Map();
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .in("id", uuids);
  if (error) throw new Error(`Loading products failed: ${error.message}`);
  return new Map((data as unknown as ProductRow[]).map((r) => [r.id, toProduct(r)]));
}

export async function searchProducts(query: ShopQuery): Promise<ShopResult> {
  const { categories, products } = await getCatalog();
  let items = [...products];

  if (query.q) {
    const terms = query.q.toLowerCase().split(/\s+/).filter(Boolean);
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    items = items.filter((p) => {
      const hay = `${p.name} ${p.material ?? ""} ${catName.get(p.categoryId) ?? ""} ${p.description}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (query.category) {
    const cat = categories.find((c) => c.slug === query.category);
    items = cat ? items.filter((p) => p.categoryId === cat.id) : [];
  }
  if (query.minPrice !== undefined) items = items.filter((p) => effectivePrice(p) >= query.minPrice!);
  if (query.maxPrice !== undefined) items = items.filter((p) => effectivePrice(p) <= query.maxPrice!);
  if (query.ageMonths !== undefined) items = items.filter((p) => minAgeMonths(p.ageRange) <= query.ageMonths!);
  if (query.material) {
    const m = query.material.toLowerCase();
    items = items.filter((p) => p.material?.toLowerCase().includes(m));
  }
  if (query.inStock) items = items.filter((p) => p.stock > 0);
  if (query.onSale) items = items.filter((p) => p.salePrice !== null && p.salePrice < p.price);

  switch (query.sort) {
    case "newest":
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "price-asc":
      items.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      break;
    case "price-desc":
      items.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      break;
    // TODO(orders): "popular" should rank by verified units sold once paid
    // orders exist. Until then it keeps the featured order.
    case "popular":
    case "featured":
    default:
      items.sort((a, b) => Number(!!b.image) - Number(!!a.image) || Number(b.isFeatured) - Number(a.isFeatured));
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toSummary), total, page, pageCount };
}
