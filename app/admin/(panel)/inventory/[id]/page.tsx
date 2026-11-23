import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, History } from "lucide-react";
import { AdminEmpty, PageTitle, btn } from "@/components/admin/ui";
import { tableHead, td, th } from "@/components/admin/list-controls";
import { AdjustStockButton } from "@/components/admin/stock-controls";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stock history" };
export const instant = false;

const REASONS: Record<string, string> = {
  initial: "Opening stock",
  restock: "New stock received",
  adjustment: "Manual adjustment",
  order: "Sold (paid order)",
  cancellation: "Order cancelled",
  refund: "Refunded & returned",
};

export default async function StockHistoryPage({ params }: PageProps<"/admin/inventory/[id]">) {
  await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: inv }, { data: moves }] = await Promise.all([
    db.from("inventory").select("id, quantity, products(id, name, sku)").eq("id", id).maybeSingle(),
    db
      .from("inventory_movements")
      .select("id, change, quantity_after, reason, note, created_at, order_id, orders(reference), profiles(full_name)")
      .eq("inventory_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (!inv) notFound();
  const product = inv.products as unknown as { id: string; name: string; sku: string };
  type Move = { id: number; change: number; quantity_after: number; reason: string; note: string | null; created_at: string; order_id: string | null; orders: { reference: string } | null; profiles: { full_name: string | null } | null };

  return (
    <>
      <Link href="/admin/inventory" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Inventory</Link>
      <PageTitle
        title={product.name}
        description={`SKU ${product.sku} · ${inv.quantity} in stock`}
        actions={<AdjustStockButton inventoryId={inv.id} productName={product.name} quantity={inv.quantity} />}
      />
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {(moves ?? []).length === 0 ? (
          <AdminEmpty Icon={History} title="No stock movements yet" text="Every change to this product's stock will be listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className={tableHead}>
                <tr><th className={th}>Date</th><th className={th}>Reason</th><th className={`${th} text-right`}>Change</th><th className={`${th} text-right`}>Stock after</th><th className={th}>Details</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {(moves as unknown as Move[]).map((m) => (
                  <tr key={m.id}>
                    <td className={`${td} text-ink/60`}>{new Date(m.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className={`${td} font-semibold`}>{REASONS[m.reason] ?? m.reason}</td>
                    <td className={cn(td, "text-right font-bold tabular-nums", m.change > 0 ? "text-emerald-700" : "text-red-600")}>{m.change > 0 ? `+${m.change}` : m.change}</td>
                    <td className={`${td} text-right tabular-nums`}>{m.quantity_after}</td>
                    <td className={`${td} text-ink/60`}>
                      {m.order_id && m.orders && <Link href={`/admin/orders/${m.order_id}`} className="font-semibold text-brand hover:underline">{m.orders.reference}</Link>}
                      {m.note && <span className="block">{m.note}</span>}
                      {m.profiles?.full_name && <span className="block text-xs text-ink/40">by {m.profiles.full_name}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
