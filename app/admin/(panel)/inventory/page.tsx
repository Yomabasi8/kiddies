import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { AdminEmpty, PageTitle, StatCard, StatusBadge } from "@/components/admin/ui";
import { FilterTabs, SearchBar, listHref, param, safeSearch, tableHead, td, th } from "@/components/admin/list-controls";
import { AdjustStockButton, ThresholdInput } from "@/components/admin/stock-controls";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { AlertTriangle, PackageX, PackageCheck } from "lucide-react";

export const metadata: Metadata = { title: "Inventory" };
export const instant = false;

type Row = {
  id: string;
  quantity: number;
  updated_at: string;
  products: { id: string; name: string; sku: string; status: string; low_stock_threshold: number; track_inventory: boolean; product_images: { url: string; is_primary: boolean }[] };
};

const stockState = (q: number, t: number) => (q === 0 ? "out of stock" : q <= t ? "low stock" : "in stock");

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireStaff();
  const sp = await searchParams;
  const filter = ["low", "out"].includes(param(sp, "filter")) ? param(sp, "filter") : "";
  const q = safeSearch(param(sp, "q")).toLowerCase();

  const { data, error } = await createAdminClient()
    .from("inventory")
    .select("id, quantity, updated_at, products!inner(id, name, sku, status, low_stock_threshold, track_inventory, product_images(url, is_primary))")
    .is("variant_id", null)
    .neq("products.status", "archived")
    .eq("products.track_inventory", true);
  if (error) throw new Error(error.message);

  const all = ((data ?? []) as unknown as Row[]).sort((a, b) => a.quantity - b.quantity || a.products.name.localeCompare(b.products.name));
  const counts = {
    out: all.filter((r) => r.quantity === 0).length,
    low: all.filter((r) => r.quantity > 0 && r.quantity <= r.products.low_stock_threshold).length,
  };
  const rows = all
    .filter((r) => (filter === "out" ? r.quantity === 0 : filter === "low" ? r.quantity > 0 && r.quantity <= r.products.low_stock_threshold : true))
    .filter((r) => !q || r.products.name.toLowerCase().includes(q) || r.products.sku.toLowerCase().includes(q));

  return (
    <>
      <PageTitle title="Inventory" description="Stock levels update automatically when paid orders are confirmed, cancelled or refunded." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tracked products" value={String(all.length)} Icon={PackageCheck} href="/admin/inventory" />
        <StatCard label="Low stock" value={String(counts.low)} Icon={AlertTriangle} tone="amber" href="/admin/inventory?filter=low" />
        <StatCard label="Out of stock" value={String(counts.out)} Icon={PackageX} tone="coral" href="/admin/inventory?filter=out" />
      </div>

      <FilterTabs
        active={filter}
        tabs={[
          { key: "", label: "All", count: all.length, href: listHref("/admin/inventory", { q }) },
          { key: "low", label: "Low stock", count: counts.low, href: listHref("/admin/inventory", { filter: "low", q }) },
          { key: "out", label: "Out of stock", count: counts.out, href: listHref("/admin/inventory", { filter: "out", q }) },
        ]}
      />
      <SearchBar placeholder="Search by product or SKU" defaultValue={q} hidden={{ filter }} />

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {rows.length === 0 ? (
          <AdminEmpty Icon={Boxes} title="Nothing here" text={filter || q ? "No products match this filter." : "Products with stock tracking turned on appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className={tableHead}>
                <tr>
                  <th className={th}>Product</th><th className={th}>SKU</th><th className={`${th} text-right`}>Available</th>
                  <th className={th}>Alert at</th><th className={th}>Status</th><th className={th}>Last updated</th>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((r) => {
                  const p = r.products;
                  const img = p.product_images.find((i) => i.is_primary) ?? p.product_images[0];
                  return (
                    <tr key={r.id} className="hover:bg-ink/[0.02]">
                      <td className={td}>
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-brand">
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#F5F6F8]">
                            {img && <Image src={img.url} alt="" fill sizes="40px" className="object-contain p-1 mix-blend-multiply" />}
                          </span>
                          {p.name}
                          {p.status === "draft" && <StatusBadge status="draft" />}
                        </Link>
                      </td>
                      <td className={`${td} font-mono text-xs text-ink/60`}>{p.sku}</td>
                      <td className={`${td} text-right text-base font-extrabold tabular-nums`}>{r.quantity}</td>
                      <td className={td}><ThresholdInput key={`${p.id}-${p.low_stock_threshold}`} productId={p.id} value={p.low_stock_threshold} /></td>
                      <td className={td}><StatusBadge status={stockState(r.quantity, p.low_stock_threshold)} /></td>
                      <td className={`${td} text-ink/55`}>{new Date(r.updated_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <AdjustStockButton inventoryId={r.id} productName={p.name} quantity={r.quantity} />
                        <Link href={`/admin/inventory/${r.id}`} className="ml-1 inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink">History</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
