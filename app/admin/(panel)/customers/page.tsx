import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { AdminEmpty, PageTitle } from "@/components/admin/ui";
import { FilterTabs, Pager, SearchBar, listHref, param, safeSearch, tableHead, td, th } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };
export const instant = false;

const PER_PAGE = 25;

type Summary = { customer_key: string; user_id: string | null; email: string; full_name: string; phone: string; orders_count: number; total_spent: number; last_order_at: string };
type Customer = Summary & { registered_at: string | null };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireStaff();
  const sp = await searchParams;
  const q = safeSearch(param(sp, "q")).toLowerCase();
  const type = ["guest", "registered"].includes(param(sp, "type")) ? param(sp, "type") : "";
  const page = Math.max(1, Number(param(sp, "page")) || 1);
  const db = createAdminClient();

  const [{ data: summary, error }, { data: profiles }, users] = await Promise.all([
    db.from("admin_customer_summary").select("customer_key, user_id, email, full_name, phone, orders_count, total_spent, last_order_at"),
    db.from("profiles").select("id, full_name, phone, created_at").eq("role", "customer"),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (error) throw new Error(error.message);

  const emails = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const fromOrders: Customer[] = ((summary ?? []) as Summary[]).map((s) => ({ ...s, registered_at: s.user_id ? profileById.get(s.user_id)?.created_at ?? null : null }));
  const withOrders = new Set(fromOrders.map((c) => c.user_id).filter(Boolean));
  // Registered customers who haven't ordered yet.
  const accountsOnly: Customer[] = (profiles ?? [])
    .filter((p) => !withOrders.has(p.id))
    .map((p) => ({ customer_key: p.id, user_id: p.id, email: emails.get(p.id) ?? "", full_name: p.full_name ?? "", phone: p.phone ?? "", orders_count: 0, total_spent: 0, last_order_at: "", registered_at: p.created_at }));

  const all = [...fromOrders, ...accountsOnly];
  const filtered = all
    .filter((c) => (type === "guest" ? !c.user_id : type === "registered" ? !!c.user_id : true))
    .filter((c) => !q || [c.full_name, c.email, c.phone].some((x) => x?.toLowerCase().includes(q)))
    .sort((a, b) => b.total_spent - a.total_spent || (b.last_order_at || "").localeCompare(a.last_order_at || ""));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageTitle title="Customers" description="Everyone who has bought from the store, including guest checkouts." />
      <FilterTabs
        active={type}
        tabs={[
          { key: "", label: "All", count: all.length, href: listHref("/admin/customers", { q }) },
          { key: "guest", label: "Guests", count: all.filter((c) => !c.user_id).length, href: listHref("/admin/customers", { type: "guest", q }) },
          { key: "registered", label: "Registered", count: all.filter((c) => c.user_id).length, href: listHref("/admin/customers", { type: "registered", q }) },
        ]}
      />
      <SearchBar placeholder="Search by name, email or phone" defaultValue={q} hidden={{ type }} />
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {rows.length === 0 ? (
          <AdminEmpty Icon={Users} title={q || type ? "No matching customers" : "No customers yet"} text={q || type ? "Try another search." : "Customers appear here after their first order."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className={tableHead}>
                <tr><th className={th}>Customer</th><th className={th}>Phone</th><th className={th}>Account</th><th className={`${th} text-right`}>Orders</th><th className={`${th} text-right`}>Total spent</th><th className={th}>Last order</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((c) => (
                  <tr key={c.customer_key} className="hover:bg-ink/[0.02]">
                    <td className={td}>
                      <Link href={`/admin/customers/${encodeURIComponent(c.customer_key)}`} className="font-semibold hover:text-brand">{c.full_name || "—"}</Link>
                      <span className="block text-xs text-ink/50">{c.email}</span>
                    </td>
                    <td className={`${td} text-ink/70`}>{c.phone || "—"}</td>
                    <td className={`${td} text-ink/60`}>{c.registered_at ? `Registered ${new Date(c.registered_at).toLocaleDateString("en-NG")}` : "Guest"}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.orders_count}</td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(Number(c.total_spent))}</td>
                    <td className={`${td} text-ink/55`}>{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("en-NG") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pager page={page} pages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} total={filtered.length} href={(p) => listHref("/admin/customers", { q, type, page: p > 1 ? String(p) : undefined })} />
    </>
  );
}
