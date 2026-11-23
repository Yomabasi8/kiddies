import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardList, Package, PackagePlus, ShoppingBag, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { AdminEmpty, Card, PageTitle, StatCard, StatusBadge, btn } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/sales-chart";
import { getDashboard, RANGES, type Granularity, type RangeKey } from "@/lib/admin/dashboard";
import { requireStaff } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const instant = false;

const VIEWS: { key: Granularity; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export default async function DashboardPage({ searchParams }: PageProps<"/admin/dashboard">) {
  const user = await requireStaff();
  const sp = await searchParams;
  const range = (RANGES.some((r) => r.key === sp.range) ? sp.range : "30d") as RangeKey;
  const view = (VIEWS.some((v) => v.key === sp.view) ? sp.view : range === "12m" ? "monthly" : range === "90d" ? "weekly" : "daily") as Granularity;
  const d = await getDashboard(range, view);
  const href = (r: string, v: string) => `/admin/dashboard?range=${r}&view=${v}`;

  return (
    <>
      <PageTitle
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Here's how the store is doing."
        actions={
          <>
            <Link href="/admin/products/new" className={btn.primary}><PackagePlus className="size-4" /> Add product</Link>
            <Link href="/admin/orders" className={btn.secondary}><ClipboardList className="size-4" /> View orders</Link>
            <Link href="/admin/inventory" className={btn.secondary}><Boxes className="size-4" /> Manage inventory</Link>
          </>
        }
      />

      {sp.denied && (
        <p role="alert" className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          That page needs an administrator account.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total revenue" value={formatPrice(d.stats.totalRevenue)} hint="Verified payments, all time" Icon={Wallet} />
        <StatCard label="Total orders" value={String(d.stats.totalOrders)} hint="Paid orders, all time" Icon={ShoppingCart} tone="sky" href="/admin/orders" />
        <StatCard label="Pending orders" value={String(d.stats.pendingOrders)} hint="Paid, awaiting processing" Icon={ShoppingBag} tone="amber" href="/admin/orders?status=paid" />
        <StatCard label="Total products" value={String(d.stats.activeProducts)} hint={`${d.stats.draftProducts} draft`} Icon={Package} href="/admin/products" />
        <StatCard label="Low stock" value={String(d.stats.lowStock)} hint="At or below threshold" Icon={AlertTriangle} tone={d.stats.lowStock ? "coral" : "brand"} href="/admin/inventory" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card
          title="Sales overview"
          action={<span className="text-sm font-bold tabular-nums">{formatPrice(d.rangeRevenue)}</span>}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1 rounded-lg bg-ink/5 p-1" role="group" aria-label="Date range">
              {RANGES.map((r) => (
                <Link key={r.key} href={href(r.key, view)} aria-current={r.key === range ? "true" : undefined} className={cn("rounded-md px-3 py-1.5 text-xs font-bold", r.key === range ? "bg-white shadow-sm" : "text-ink/55 hover:text-ink")}>
                  {r.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg bg-ink/5 p-1" role="group" aria-label="Group by">
              {VIEWS.map((v) => (
                <Link key={v.key} href={href(range, v.key)} aria-current={v.key === view ? "true" : undefined} className={cn("rounded-md px-3 py-1.5 text-xs font-bold", v.key === view ? "bg-white shadow-sm" : "text-ink/55 hover:text-ink")}>
                  {v.label}
                </Link>
              ))}
            </div>
          </div>
          <SalesChart data={d.series} />
        </Card>

        <Card title="Low-stock alerts" action={<Link href="/admin/inventory" className="text-sm font-bold text-brand hover:underline">Inventory</Link>}>
          {d.lowStock.length === 0 ? (
            <AdminEmpty Icon={Boxes} title="Stock looks healthy" text="Products at or below their low-stock threshold will appear here." />
          ) : (
            <ul className="divide-y divide-ink/5">
              {d.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 truncate text-sm font-semibold hover:text-brand">{p.name}</Link>
                  <StatusBadge status={p.quantity === 0 ? "out of stock" : "low stock"} label={p.quantity === 0 ? "Out of stock" : `${p.quantity} left`} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-bold text-brand hover:underline">All orders</Link>}>
          {d.recentOrders.length === 0 ? (
            <AdminEmpty Icon={ShoppingCart} title="No orders yet" text="Orders appear here as soon as customers check out." />
          ) : (
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-ink/[0.03] text-left text-xs font-bold uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Fulfilment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {d.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-ink/[0.02]">
                      <td className="px-5 py-3 font-bold"><Link href={`/admin/orders/${o.id}`} className="hover:text-brand">{o.reference}</Link></td>
                      <td className="px-5 py-3">{o.full_name}</td>
                      <td className="px-5 py-3 text-ink/60">{new Date(o.created_at).toLocaleDateString("en-NG")}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatPrice(o.total)}</td>
                      <td className="px-5 py-3"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Top-selling products">
          {d.topProducts.length === 0 ? (
            <AdminEmpty Icon={TrendingUp} title="No sales yet" text="Your best sellers will show here, based on paid orders." />
          ) : (
            <ul className="space-y-3">
              {d.topProducts.map((p) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                    {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-contain mix-blend-multiply" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-ink/50">{p.units} sold</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
