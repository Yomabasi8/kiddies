import type { ShopQuery, ShopSort } from "./types";

/** URL search params as delivered to a page. */
export type RawParams = Record<string, string | string[] | undefined>;

const SORTS: ShopSort[] = ["featured", "newest", "price-asc", "price-desc", "popular"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

function int(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/**
 * Parse shop URL params into a typed query. Prices in the URL are whole
 * Naira; the query uses kobo. Unknown or malformed values are ignored.
 */
export function parseShopParams(raw: RawParams): ShopQuery {
  const sort = one(raw.sort) as ShopSort | undefined;
  const min = int(one(raw.min));
  const max = int(one(raw.max));
  return {
    q: one(raw.q)?.slice(0, 80),
    category: one(raw.category),
    minPrice: min !== undefined ? min * 100 : undefined,
    maxPrice: max !== undefined ? max * 100 : undefined,
    ageMonths: int(one(raw.age)),
    material: one(raw.material),
    inStock: one(raw.in_stock) === "true",
    onSale: one(raw.on_sale) === "true",
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    page: int(one(raw.page)) || 1,
  };
}

/** Build a /shop href from raw params with some keys overridden. */
export function shopHref(raw: RawParams, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    const val = one(v);
    if (val) params.set(k, val);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) params.delete(k);
    else params.set(k, v);
  }
  params.delete("focus");
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}
