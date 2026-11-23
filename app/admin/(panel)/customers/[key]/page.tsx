import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { AdminEmpty, Card, PageTitle, StatCard, StatusBadge, btn } from "@/components/admin/ui";
import { tableHead, td, th } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { Receipt, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Customer" };
export const instant = false;

const REVENUE = ["paid", "processing", "dispatched", "delivered"];

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[key]">) {
  await requireStaff();
  const key = decodeURIComponent((await params).key);
  const isUser = /^[0-9a-f-]{36}$/i.test(key);
  if (!isUser && !/^[^\s@]+@[^\s@]+$/.test(key)) notFound();
  const db = createAdminClient();

  const ordersQuery = db.from("orders").select("id, reference, full_name, email, phone, total, status, created_at, city, state").order("created_at", { ascending: false });
  const [{ data: orders }, profile, authUser] = await Promise.all([
    isUser ? ordersQuery.eq("user_id", key) : ordersQuery.is("user_id", null).ilike("email", key),
    isUser ? db.from("profiles").select("full_name, phone, created_at").eq("id", key).maybeSingle() : Promise.resolve({ data: null }),
    isUser ? db.auth.admin.getUserById(key) : Promise.resolve({ data: { user: null } }),
  ]);
  const list = orders ?? [];
  if (!list.length && !profile.data) notFound();

  const latest = list[0];
  const name = profile.data?.full_name || latest?.full_name || "Customer";
  const email = authUser.data.user?.email || latest?.email || key;
  const paid = list.filter((o) => REVENUE.includes(o.status));
  const spent = paid.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <Link href="/admin/customers" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Customers</Link>
      <PageTitle title={name} description={isUser ? `Registered ${new Date(profile.data!.created_at).toLocaleDateString("en-NG")}` : "Guest customer"} />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card title="Contact">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink/55">Email</dt><dd className="font-semibold"><a href={`mailto:${email}`} className="text-brand hover:underline">{email}</a></dd></div>
              <div><dt className="text-ink/55">Phone</dt><dd className="font-semibold">{profile.data?.phone || latest?.phone || "—"}</dd></div>
              {latest && <div><dt className="text-ink/55">Last delivery area</dt><dd className="font-semibold">{latest.city}, {latest.state}</dd></div>}
            </dl>
          </Card>
          <StatCard label="Paid orders" value={String(paid.length)} Icon={Receipt} />
          <StatCard label="Total spent" value={formatPrice(spent)} Icon={Wallet} />
          {paid.length > 0 && <StatCard label="Average order" value={formatPrice(Math.round(spent / paid.length))} Icon={Wallet} tone="sky" />}
        </div>
        <Card title="Order history">
          {list.length === 0 ? (
            <AdminEmpty Icon={ShoppingCart} title="No orders yet" text="This customer has an account but hasn't ordered." />
          ) : (
            <div className="-m-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className={tableHead}><tr><th className={th}>Order</th><th className={th}>Date</th><th className={`${th} text-right`}>Total</th><th className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-ink/5">
                  {list.map((o) => (
                    <tr key={o.id} className="hover:bg-ink/[0.02]">
                      <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-bold hover:text-brand">{o.reference}</Link></td>
                      <td className={`${td} text-ink/60`}>{new Date(o.created_at).toLocaleDateString("en-NG")}</td>
                      <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(o.total)}</td>
                      <td className={td}><StatusBadge status={o.status} label={o.status === "paid" ? "Pending" : undefined} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
