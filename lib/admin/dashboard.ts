import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dashboard figures, computed from real records only. Revenue counts orders
 * whose payment was verified (paid → delivered); cancelled/refunded and
 * unpaid "pending" checkouts are excluded.
 *
 * Callers must have passed requireStaff() first.
 */

export const REVENUE_STATUSES = ["paid", "processing", "dispatched", "delivered"] as const;

export type RangeKey = "7d" | "30d" | "90d" | "12m";
export type Granularity = "daily" | "weekly" | "monthly";

export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "12m", label: "Last 12 months", days: 365 },
];

export type SalesPoint = { label: string; start: string; revenue: number; orders: number };

function bucketStart(d: Date, g: Granularity) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (g === "weekly") x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); // Monday
  if (g === "monthly") x.setUTCDate(1);
  return x;
}

function nextBucket(d: Date, g: Granularity) {
  const x = new Date(d);
  if (g === "daily") x.setUTCDate(x.getUTCDate() + 1);
  else if (g === "weekly") x.setUTCDate(x.getUTCDate() + 7);
  else x.setUTCMonth(x.getUTCMonth() + 1);
  return x;
}

function labelFor(d: Date, g: Granularity) {
  return g === "monthly"
    ? d.toLocaleDateString("en-NG", { month: "short", year: "2-digit", timeZone: "UTC" })
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });
}

export async function getDashboard(range: RangeKey, granularity: Granularity) {
  const db = createAdminClient();
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);

  const [revenueRows, rangeRows, awaiting, activeProducts, draftProducts, stockRows, recent, soldItems] = await Promise.all([
    db.from("orders").select("total").in("status", [...REVENUE_STATUSES]),
    db.from("orders").select("total, paid_at").in("status", [...REVENUE_STATUSES]).gte("paid_at", since.toISOString()),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    db.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
    db
      .from("inventory")
      .select("quantity, products!inner(id, name, slug, low_stock_threshold, track_inventory, status)")
      .is("variant_id", null)
      .eq("products.track_inventory", true)
      .neq("products.status", "archived"),
    db
      .from("orders")
      .select("id, reference, full_name, total, status, created_at, payments(status)")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("order_items")
      .select("product_id, product_name, image_url, quantity, line_total, orders!inner(status)")
      .in("orders.status", [...REVENUE_STATUSES]),
  ]);

  for (const r of [revenueRows, rangeRows, awaiting, activeProducts, draftProducts, stockRows, recent, soldItems]) {
    if (r.error) throw new Error(`Dashboard query failed: ${r.error.message}`);
  }

  const totalRevenue = (revenueRows.data ?? []).reduce((s, o) => s + o.total, 0);
  const totalOrders = revenueRows.data?.length ?? 0;

  // Sales series with empty buckets filled in.
  const series: SalesPoint[] = [];
  const index = new Map<string, SalesPoint>();
  for (let b = bucketStart(since, granularity); b <= now; b = nextBucket(b, granularity)) {
    const point = { label: labelFor(b, granularity), start: b.toISOString(), revenue: 0, orders: 0 };
    series.push(point);
    index.set(point.start, point);
  }
  for (const o of rangeRows.data ?? []) {
    if (!o.paid_at) continue;
    const p = index.get(bucketStart(new Date(o.paid_at), granularity).toISOString());
    if (p) {
      p.revenue += o.total;
      p.orders += 1;
    }
  }

  type StockRow = { quantity: number; products: { id: string; name: string; slug: string; low_stock_threshold: number } };
  const lowStock = ((stockRows.data ?? []) as unknown as StockRow[])
    .filter((r) => r.quantity <= r.products.low_stock_threshold)
    .map((r) => ({ id: r.products.id, name: r.products.name, quantity: r.quantity, threshold: r.products.low_stock_threshold }))
    .sort((a, b) => a.quantity - b.quantity);

  const top = new Map<string, { name: string; image: string | null; units: number; revenue: number }>();
  for (const i of soldItems.data ?? []) {
    const key = i.product_id ?? i.product_name;
    const t = top.get(key) ?? { name: i.product_name, image: i.image_url, units: 0, revenue: 0 };
    t.units += i.quantity;
    t.revenue += i.line_total;
    top.set(key, t);
  }

  type RecentRow = { id: string; reference: string; full_name: string; total: number; status: string; created_at: string; payments: { status: string }[] };
  return {
    stats: {
      totalRevenue,
      totalOrders,
      pendingOrders: awaiting.count ?? 0,
      activeProducts: activeProducts.count ?? 0,
      draftProducts: draftProducts.count ?? 0,
      lowStock: lowStock.length,
    },
    series,
    rangeRevenue: series.reduce((s, p) => s + p.revenue, 0),
    recentOrders: ((recent.data ?? []) as RecentRow[]).map((o) => ({
      ...o,
      paymentStatus: o.payments?.[0]?.status ?? "pending",
    })),
    topProducts: [...top.values()].sort((a, b) => b.units - a.units).slice(0, 5),
    lowStock: lowStock.slice(0, 8),
  };
}
