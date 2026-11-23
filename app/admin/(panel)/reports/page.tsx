import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Boxes, Package, Receipt, ShoppingCart, Users, Wallet } from "lucide-react";
import { AdminEmpty, Card, PageTitle, StatCard } from "@/components/admin/ui";
import { tableHead, td, th } from "@/components/admin/list-controls";
import { SalesChart } from "@/components/admin/sales-chart";
import { RANGES, type Granularity, type RangeKey } from "@/lib/admin/dashboard";
import { getReport } from "@/lib/admin/reports";
import { requireStaff } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics & Reports" };
export const instant = false;

const VIEWS: { key: Granularity; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireStaff();
  const sp = await searchParams;
  const range = (RANGES.some((r) => r.key === sp.range) ? sp.range : "30d") as RangeKey;
  const view = (VIEWS.some((v) => v.key === sp.view) ? sp.view : range === "12m" ? "monthly" : range === "90d" ? "weekly" : "daily") as Granularity;
  const r = await getReport(range, view);
  const href = (rk: string, v: string) => `/admin/reports?range=${rk}&view=${v}`;
  const maxCat = Math.max(...r.topCategories.map((c) => c.revenue), 1);

  return (
    <>
      <PageTitle title="Analytics & Reports" description="Based on verified, paid orders (cancelled and refunded orders excluded)." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-ink/10" role="group" aria-label="Date range">
          {RANGES.map((x) => (
            <Link key={x.key} href={href(x.key, view)} aria-current={x.key === range ? "true" : undefined} className={cn("rounded-md px-3 py-1.5 text-xs font-bold", x.key === range ? "bg-ink text-white" : "text-ink/55 hover:text-ink")}>{x.label}</Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(r.revenue)} Icon={Wallet} />
        <StatCard label="Orders" value={String(r.orders)} Icon={ShoppingCart} tone="sky" />
        <StatCard label="Average order value" value={formatPrice(r.aov)} Icon={Receipt} tone="amber" />
        <StatCard label="Units sold" value={String(r.units)} Icon={Package} />
      </div>

      <Card title="Sales over time" className="mt-6" action={
        <div className="flex gap-1 rounded-lg bg-ink/5 p-1" role="group" aria-label="Group by">
          {VIEWS.map((v) => (
            <Link key={v.key} href={href(range, v.key)} aria-current={v.key === view ? "true" : undefined} className={cn("rounded-md px-2.5 py-1 text-xs font-bold", v.key === view ? "bg-white shadow-sm" : "text-ink/55")}>{v.label}</Link>
          ))}
        </div>
      }>
        <SalesChart data={r.series} />
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Bestselling products">
          {r.topProducts.length === 0 ? (
            <AdminEmpty Icon={BarChart3} title="No sales in this period" text="Bestsellers appear once orders are paid." />
          ) : (
            <div className="-m-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={tableHead}><tr><th className={th}>Product</th><th className={`${th} text-right`}>Units</th><th className={`${th} text-right`}>Revenue</th></tr></thead>
                <tbody className="divide-y divide-ink/5">
                  {r.topProducts.map((p) => (
                    <tr key={p.name}><td className={`${td} font-semibold`}>{p.name}</td><td className={`${td} text-right tabular-nums`}>{p.units}</td><td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(p.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Bestselling categories">
          {r.topCategories.length === 0 ? (
            <AdminEmpty Icon={BarChart3} title="No sales in this period" text="Category performance appears once orders are paid." />
          ) : (
            <ul className="space-y-3">
              {r.topCategories.map((c) => (
                <li key={c.name}>
                  <div className="flex justify-between text-sm"><span className="font-semibold">{c.name}</span><span className="tabular-nums"><span className="text-ink/50">{c.units} units · </span><span className="font-bold">{formatPrice(c.revenue)}</span></span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/5"><div className="h-full rounded-full" style={{ width: `${(c.revenue / maxCat) * 100}%`, background: "#0B8A62" }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Inventory performance">
          {r.inventory.length === 0 ? (
            <AdminEmpty Icon={Boxes} title="No tracked stock" text="Turn on stock tracking for products to see this." />
          ) : (
            <div className="-m-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={tableHead}><tr><th className={th}>Product</th><th className={`${th} text-right`}>Sold</th><th className={`${th} text-right`}>On hand</th><th className={`${th} text-right`} title="Units sold ÷ (sold + on hand)">Sell-through</th></tr></thead>
                <tbody className="divide-y divide-ink/5">
                  {r.inventory.map((p) => (
                    <tr key={p.id}>
                      <td className={td}><Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-brand">{p.name}</Link></td>
                      <td className={`${td} text-right tabular-nums`}>{p.sold}</td>
                      <td className={`${td} text-right tabular-nums`}>{p.onHand}</td>
                      <td className={`${td} text-right tabular-nums`}>{pct(p.sellThrough)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Customer purchase trends">
          {r.customers.total === 0 ? (
            <AdminEmpty Icon={Users} title="No customers in this period" text="New and returning customers appear once orders are paid." />
          ) : (
            <dl className="grid grid-cols-2 gap-4">
              <Metric label="Customers" value={String(r.customers.total)} />
              <Metric label="Repeat rate" value={pct(r.customers.repeatRate)} hint="Bought before or more than once" />
              <Metric label="New customers" value={String(r.customers.new)} />
              <Metric label="Returning customers" value={String(r.customers.returning)} />
            </dl>
          )}
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-ink/[0.03] p-4">
      <dt className="text-sm text-ink/55">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold tabular-nums">{value}</dd>
      {hint && <p className="text-xs text-ink/45">{hint}</p>}
    </div>
  );
}
