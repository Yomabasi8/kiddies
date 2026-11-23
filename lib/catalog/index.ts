import "server-only";
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from "./sample-data";
import { SAMPLE_DETAILS } from "./sample-details";
import type {
  Category,
  CategoryWithCount,
  Product,
  ProductDetail,
  ShopQuery,
  ShopResult,
} from "./types";

/**
 * Catalogue data access. Every storefront read goes through here, so moving
 * to Supabase means changing these functions, not the components.
 *
 * TODO(supabase): replace sample data with queries that only return active,
 * published products and visible categories.
 */

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

export async function getCategories(): Promise<CategoryWithCount[]> {
  return SAMPLE_CATEGORIES.map((c) => ({
    ...c,
    productCount: SAMPLE_PRODUCTS.filter((p) => p.categoryId === c.id).length,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return SAMPLE_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return SAMPLE_PRODUCTS.filter((p) => p.isFeatured);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return SAMPLE_PRODUCTS.map((p) => p.slug);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const p = SAMPLE_PRODUCTS.find((x) => x.slug === slug);
  if (!p) return null;
  const d = SAMPLE_DETAILS[p.id];
  return {
    ...p,
    sku: d?.sku ?? p.id.toUpperCase(),
    description: d?.description ?? "",
    gallery: d?.gallery ?? [],
    specs: d?.specs ?? [],
    careInstructions: d?.careInstructions ?? null,
  };
}

/** Same-category products first, then others, excluding the product itself. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const others = SAMPLE_PRODUCTS.filter((p) => p.id !== product.id && p.image);
  const same = others.filter((p) => p.categoryId === product.categoryId);
  const rest = others.filter((p) => p.categoryId !== product.categoryId);
  return [...same, ...rest].slice(0, limit);
}

/** Look up current products by id, for server-side cart revalidation. */
export async function getProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  const set = new Set(ids);
  return new Map(SAMPLE_PRODUCTS.filter((p) => set.has(p.id)).map((p) => [p.id, p]));
}

export async function searchProducts(query: ShopQuery): Promise<ShopResult> {
  let items = [...SAMPLE_PRODUCTS];

  if (query.q) {
    const terms = query.q.toLowerCase().split(/\s+/).filter(Boolean);
    const catName = new Map(SAMPLE_CATEGORIES.map((c) => [c.id, c.name]));
    items = items.filter((p) => {
      const hay = `${p.name} ${p.material ?? ""} ${catName.get(p.categoryId) ?? ""} ${SAMPLE_DETAILS[p.id]?.description ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (query.category) {
    const cat = SAMPLE_CATEGORIES.find((c) => c.slug === query.category);
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
    // TODO(supabase): "popular" should rank by verified units sold. With no
    // sales data yet it keeps the featured order.
    case "popular":
    case "featured":
    default:
      items.sort((a, b) => Number(!!b.image) - Number(!!a.image) || Number(b.isFeatured) - Number(a.isFeatured));
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pageCount };
}
