import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package, PackagePlus, Search } from "lucide-react";
import { AdminEmpty, PageTitle, StatusBadge, btn, field } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };
export const instant = false;

const PER_PAGE = 20;
const SORTS = {
  newest: { col: "created_at", asc: false, label: "Newest" },
  oldest: { col: "created_at", asc: true, label: "Oldest" },
  name: { col: "name", asc: true, label: "Name A–Z" },
  "price-asc": { col: "price", asc: true, label: "Price: low to high" },
  "price-desc": { col: "price", asc: false, label: "Price: high to low" },
} as const;

type Row = {
  id: string;
  name: string;
  sku: string;
  price: number;
  sale_price: number | null;
  status: string;
  created_at: string;
  track_inventory: boolean;
  low_stock_threshold: number;
  categories: { name: string } | null;
  product_images: { url: string; is_primary: boolean; image_style: string }[];
  inventory: { quantity: number; variant_id: string | null }[];
};

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireStaff();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = one("q").trim().slice(0, 80);
  const category = one("category");
  const status = ["draft", "active", "archived"].includes(one("status")) ? one("status") : "";
  const sortKey = (one("sort") in SORTS ? one("sort") : "newest") as keyof typeof SORTS;
  const page = Math.max(1, Number(one("page")) || 1);

  const db = createAdminClient();
  let query = db
    .from("products")
    .select(
      "id, name, sku, price, sale_price, status, created_at, track_inventory, low_stock_threshold, categories(name), product_images(url, is_primary, image_style), inventory(quantity, variant_id)",
      { count: "exact" },
    );
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ");
    query = query.or(`name.ilike.%${safe}%,sku.ilike.%${safe}%`);
  }
  if (category) query = query.eq("category_id", category);
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "archived");
  const sort = SORTS[sortKey];
  const [{ data, count, error }, { data: categories }] = await Promise.all([
    query.order(sort.col, { ascending: sort.asc }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    db.from("categories").select("id, name").order("sort_order"),
  ]);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(status && { status }), ...(sortKey !== "newest" && { sort: sortKey }), ...overrides });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/products${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Products"
        description={`${total} ${total === 1 ? "product" : "products"}${status ? ` · ${status}` : ""}`}
        actions={<Link href="/admin/products/new" className={btn.primary}><PackagePlus className="size-4" /> Add product</Link>}
      />

      {(sp.archived || sp.deleted) && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {sp.deleted ? "Product deleted." : "Product archived. It's hidden from the shop."}
        </p>
      )}

      <form className="mb-4 flex flex-wrap gap-2 rounded-xl border border-ink/10 bg-white p-3" role="search">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input name="q" defaultValue={q} placeholder="Search name or SKU" className={cn(field, "pl-9")} />
        </label>
        <select name="category" defaultValue={category} aria-label="Category" className={cn(field, "w-auto")}>
          <option value="">All categories</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} aria-label="Status" className={cn(field, "w-auto")}>
          <option value="">Active & draft</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select name="sort" defaultValue={sortKey} aria-label="Sort" className={cn(field, "w-auto")}>
          {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
        <button type="submit" className={btn.secondary}>Apply</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {rows.length === 0 ? (
          <AdminEmpty
            Icon={Package}
            title={q || category || status ? "No products match" : "No products yet"}
            text={q || category || status ? "Try a different search or filter." : "Add your first product to start selling."}
            action={<Link href="/admin/products/new" className={btn.primary}>Add product</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-ink/[0.03] text-left text-xs font-bold uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((p) => {
                  const img = p.product_images.find((i) => i.is_primary) ?? p.product_images[0];
                  const stock = p.inventory.filter((i) => !i.variant_id).reduce((s, i) => s + i.quantity, 0);
                  const stockState = !p.track_inventory ? null : stock === 0 ? "out of stock" : stock <= p.low_stock_threshold ? "low stock" : null;
                  return (
                    <tr key={p.id} className="hover:bg-ink/[0.02]">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-brand">
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#F5F6F8]">
                            {img && <Image src={img.url} alt="" fill sizes="44px" className={img.image_style === "photo" ? "object-cover" : "object-contain p-1 mix-blend-multiply"} />}
                          </span>
                          <span className="line-clamp-2">{p.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink/60">{p.sku}</td>
                      <td className="px-4 py-3 text-ink/70">{p.categories?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.sale_price ? (
                          <><span className="font-bold text-red-600">{formatPrice(p.sale_price)}</span> <span className="text-xs text-ink/40 line-through">{formatPrice(p.price)}</span></>
                        ) : (
                          <span className="font-semibold">{formatPrice(p.price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.track_inventory ? (
                          <span className="inline-flex items-center gap-2 tabular-nums">
                            {stockState && <StatusBadge status={stockState} label={stockState === "out of stock" ? "Out" : "Low"} />}
                            <span className="font-semibold">{stock}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-ink/45">Not tracked</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-ink/55">{new Date(p.created_at).toLocaleDateString("en-NG")}</td>
                      <td className="px-4 py-3 text-right"><Link href={`/admin/products/${p.id}`} className={btn.ghost}>Edit</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink/55">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Link aria-disabled={page <= 1} href={qs({ page: String(page - 1) })} className={cn(btn.secondary, page <= 1 && "pointer-events-none opacity-40")}><ChevronLeft className="size-4" /> Previous</Link>
            <Link aria-disabled={page >= pages} href={qs({ page: String(page + 1) })} className={cn(btn.secondary, page >= pages && "pointer-events-none opacity-40")}>Next <ChevronRight className="size-4" /></Link>
          </div>
        </nav>
      )}
    </>
  );
}
