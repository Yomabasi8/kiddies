import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVENUE_STATUSES, RANGES, getDashboard, type Granularity, type RangeKey } from "./dashboard";

/**
 * Business reports for a date range. Only orders with a verified payment
 * that weren't cancelled/refunded count as sales.
 */
export async function getReport(range: RangeKey, granularity: Granularity) {
  const db = createAdminClient();
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  type OrderRow = { id: string; total: number; email: string; user_id: string | null; paid_at: string };
  type ItemRow = { product_id: string | null; product_name: string; quantity: number; line_total: number; orders: { paid_at: string; status: string } };

  const [orders, items, priorBuyers, stock, categories, dashboard] = await Promise.all([
    db.from("orders").select("id, total, email, user_id, paid_at").in("status", [...REVENUE_STATUSES]).gte("paid_at", since),
    db
      .from("order_items")
      .select("product_id, product_name, quantity, line_total, orders!inner(paid_at, status)")
      .in("orders.status", [...REVENUE_STATUSES])
      .gte("orders.paid_at", since),
    db.from("orders").select("email").in("status", [...REVENUE_STATUSES]).lt("paid_at", since),
    db.from("inventory").select("quantity, products!inner(id, name, category_id, track_inventory, status)").is("variant_id", null).neq("products.status", "archived"),
    db.from("categories").select("id, name"),
    getDashboard(range, granularity),
  ]);
  for (const r of [orders, items, priorBuyers, stock, categories]) if (r.error) throw new Error(r.error.message);

  const o = (orders.data ?? []) as OrderRow[];
  const it = (items.data ?? []) as unknown as ItemRow[];
  const revenue = o.reduce((s, x) => s + x.total, 0);
  const units = it.reduce((s, x) => s + x.quantity, 0);

  // Products
  type Stock = { quantity: number; products: { id: string; name: string; category_id: string; track_inventory: boolean } };
  const stockRows = (stock.data ?? []) as unknown as Stock[];
  const productCategory = new Map(stockRows.map((s) => [s.products.id, s.products.category_id]));
  const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const x of it) {
    const key = x.product_id ?? x.product_name;
    const p = byProduct.get(key) ?? { name: x.product_name, units: 0, revenue: 0 };
    p.units += x.quantity;
    p.revenue += x.line_total;
    byProduct.set(key, p);
  }

  // Categories (by the product's current category)
  const catName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const byCategory = new Map<string, { name: string; units: number; revenue: number }>();
  for (const x of it) {
    const cid = x.product_id ? productCategory.get(x.product_id) : undefined;
    const name = cid ? catName.get(cid) ?? "Uncategorised" : "Removed products";
    const c = byCategory.get(name) ?? { name, units: 0, revenue: 0 };
    c.units += x.quantity;
    c.revenue += x.line_total;
    byCategory.set(name, c);
  }

  // Inventory performance: stock on hand vs units sold in the period.
  const inventory = stockRows
    .filter((s) => s.products.track_inventory)
    .map((s) => {
      const sold = byProduct.get(s.products.id)?.units ?? 0;
      return { id: s.products.id, name: s.products.name, onHand: s.quantity, sold, sellThrough: sold + s.quantity > 0 ? sold / (sold + s.quantity) : 0 };
    })
    .sort((a, b) => b.sold - a.sold || a.onHand - b.onHand);

  // Customers: new vs returning, by email.
  const before = new Set((priorBuyers.data ?? []).map((r) => r.email.toLowerCase()));
  const perCustomer = new Map<string, number>();
  for (const x of o) perCustomer.set(x.email.toLowerCase(), (perCustomer.get(x.email.toLowerCase()) ?? 0) + 1);
  const customers = perCustomer.size;
  const returning = [...perCustomer.keys()].filter((e) => before.has(e) || (perCustomer.get(e) ?? 0) > 1).length;

  return {
    revenue,
    orders: o.length,
    aov: o.length ? Math.round(revenue / o.length) : 0,
    units,
    series: dashboard.series,
    topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    topCategories: [...byCategory.values()].sort((a, b) => b.revenue - a.revenue),
    inventory: inventory.slice(0, 15),
    customers: { total: customers, returning, new: customers - returning, repeatRate: customers ? returning / customers : 0 },
  };
}
