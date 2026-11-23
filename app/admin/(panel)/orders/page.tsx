import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { AdminEmpty, PageTitle, StatusBadge } from "@/components/admin/ui";
import { FilterTabs, Pager, SearchBar, listHref, param, safeSearch, tableHead, td, th } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };
export const instant = false;

const PER_PAGE = 25;
const TABS = [
  { key: "", label: "All orders" },
  { key: "pending", label: "Awaiting payment" },
  { key: "paid", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
  { key: "attention", label: "Needs attention" },
];

type Row = {
  id: string; reference: string; full_name: string; email: string; total: number; status: string;
  created_at: string; needs_attention: boolean; order_items: { quantity: number }[]; payments: { status: string }[];
};

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff();
  const sp = await searchParams;
  const status = TABS.some((t) => t.key === param(sp, "status")) ? param(sp, "status") : "";
  const q = safeSearch(param(sp, "q"));
  const page = Math.max(1, Number(param(sp, "page")) || 1);

  let query = createAdminClient()
    .from("orders")
    .select("id, reference, full_name, email, total, status, created_at, needs_attention, order_items(quantity), payments(status)", { count: "exact" });
  if (status === "attention") query = query.eq("needs_attention", true);
  else if (status) query = query.eq("status", status);
  if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Row[];
  const total = count ?? 0;
  const href = (p: number) => listHref("/admin/orders", { status, q, page: p > 1 ? String(p) : undefined });

  return (
    <>
      <PageTitle title="Orders" description="Review payments, process orders and update fulfilment." />
      <FilterTabs active={status} tabs={TABS.map((t) => ({ ...t, href: listHref("/admin/orders", { status: t.key, q }) }))} />
      <SearchBar placeholder="Search by order reference, name, email or phone" defaultValue={q} hidden={{ status }} />

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {rows.length === 0 ? (
          <AdminEmpty Icon={ShoppingCart} title={q || status ? "No matching orders" : "No orders yet"} text={q || status ? "Try another filter or search." : "Orders appear here as soon as customers check out."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className={tableHead}>
                <tr>
                  <th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Date</th>
                  <th className={`${th} text-right`}>Items</th><th className={`${th} text-right`}>Total</th>
                  <th className={th}>Payment</th><th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((o) => (
                  <tr key={o.id} className="hover:bg-ink/[0.02]">
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 font-bold hover:text-brand">
                        {o.needs_attention && <AlertTriangle className="size-4 text-amber-600" aria-label="Needs attention" />}
                        {o.reference}
                      </Link>
                    </td>
                    <td className={td}><span className="block font-semibold">{o.full_name}</span><span className="text-xs text-ink/50">{o.email}</span></td>
                    <td className={`${td} text-ink/60`}>{new Date(o.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className={`${td} text-right tabular-nums`}>{o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(o.total)}</td>
                    <td className={td}><StatusBadge status={o.payments[0]?.status ?? "pending"} /></td>
                    <td className={td}><StatusBadge status={o.status} label={o.status === "paid" ? "Pending" : undefined} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pager page={page} pages={Math.max(1, Math.ceil(total / PER_PAGE))} total={total} href={href} />
    </>
  );
}
