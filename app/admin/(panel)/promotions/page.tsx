import type { Metadata } from "next";
import Link from "next/link";
import { Tag, TicketPlus } from "lucide-react";
import { AdminEmpty, PageTitle, StatusBadge, btn } from "@/components/admin/ui";
import { param, tableHead, td, th } from "@/components/admin/list-controls";
import { CouponToggle } from "@/components/admin/coupon-toggle";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Promotions" };
export const instant = false;

type Row = {
  id: string; code: string; description: string | null; discount_type: "percent" | "fixed"; value: number; min_subtotal: number; scope: string;
  starts_at: string | null; ends_at: string | null; usage_limit: number | null; is_active: boolean; coupon_redemptions: { id: string }[];
};

function period(r: Row) {
  const now = Date.now();
  if (r.ends_at && new Date(r.ends_at).getTime() <= now) return { key: "expired", label: "Expired" };
  if (r.starts_at && new Date(r.starts_at).getTime() > now) return { key: "scheduled", label: "Scheduled" };
  return null;
}
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : null);

export default async function PromotionsPage({ searchParams }: PageProps<"/admin/promotions">) {
  await requireStaff();
  const sp = await searchParams;
  const { data, error } = await createAdminClient()
    .from("coupons")
    .select("id, code, description, discount_type, value, min_subtotal, scope, starts_at, ends_at, usage_limit, is_active, coupon_redemptions(id)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageTitle title="Promotions" description="Coupon codes customers can use at checkout." actions={<Link href="/admin/promotions/new" className={btn.primary}><TicketPlus className="size-4" /> Create coupon</Link>} />
      {sp.saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Saved coupon {param(sp, "saved")}.</p>}
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {rows.length === 0 ? (
          <AdminEmpty Icon={Tag} title="No coupons yet" text="Create a coupon for a sale, a welcome discount or a special occasion." action={<Link href="/admin/promotions/new" className={btn.primary}>Create coupon</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className={tableHead}>
                <tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Applies to</th><th className={th}>Period</th><th className={`${th} text-right`}>Used</th><th className={th}>Active</th><th className={th}><span className="sr-only">Edit</span></th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((r) => {
                  const p = period(r);
                  return (
                    <tr key={r.id} className="hover:bg-ink/[0.02]">
                      <td className={td}>
                        <Link href={`/admin/promotions/${r.id}`} className="font-mono font-bold hover:text-brand">{r.code}</Link>
                        {r.description && <span className="block text-xs text-ink/50">{r.description}</span>}
                      </td>
                      <td className={`${td} font-semibold`}>
                        {r.discount_type === "percent" ? `${r.value}% off` : `${formatPrice(r.value)} off`}
                        {r.min_subtotal > 0 && <span className="block text-xs font-normal text-ink/50">Min. {formatPrice(r.min_subtotal)}</span>}
                      </td>
                      <td className={`${td} capitalize text-ink/70`}>{r.scope === "all" ? "Everything" : `Selected ${r.scope}`}</td>
                      <td className={`${td} text-ink/60`}>
                        {p ? <StatusBadge status={p.key === "expired" ? "cancelled" : "pending"} label={p.label} /> : null}
                        <span className="block text-xs">{fmt(r.starts_at) ?? "Now"} → {fmt(r.ends_at) ?? "No end"}</span>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{r.coupon_redemptions.length}{r.usage_limit ? ` / ${r.usage_limit}` : ""}</td>
                      <td className={td}><CouponToggle id={r.id} active={r.is_active} code={r.code} /></td>
                      <td className={`${td} text-right`}><Link href={`/admin/promotions/${r.id}`} className={btn.ghost}>Edit</Link></td>
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
