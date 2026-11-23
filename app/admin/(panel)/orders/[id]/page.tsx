import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, ExternalLink } from "lucide-react";
import { OrderActionsPanel } from "@/components/admin/order-actions-panel";
import { Card, PageTitle, StatusBadge, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order details" };
export const instant = false;

const STEPS = ["pending", "paid", "processing", "dispatched", "delivered"] as const;
const STEP_LABEL: Record<string, string> = { pending: "Order created", paid: "Payment confirmed", processing: "Processing", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "");

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: o }, { data: history }, { data: notes }] = await Promise.all([
    db.from("orders").select("*, order_items(*), payments(*)").eq("id", id).maybeSingle(),
    db.from("order_status_history").select("to_status, note, created_at, profiles(full_name)").eq("order_id", id).order("created_at"),
    db.from("order_notes").select("id, body, created_at, profiles(full_name)").eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  if (!o) notFound();

  type Item = { id: string; product_id: string | null; product_name: string; variant_name: string | null; sku: string | null; image_url: string | null; unit_price: number; quantity: number; line_total: number };
  type Payment = { id: string; provider: string; reference: string; amount: number; status: string; channel: string | null; paid_at: string | null; refunded_amount: number; created_at: string };
  const items = (o.order_items ?? []) as Item[];
  const payment = ([...(o.payments ?? [])] as Payment[]).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const verified = payment && ["success", "partially_refunded", "refunded"].includes(payment.status);
  const refundable = verified ? payment.amount - payment.refunded_amount : 0;
  type Hist = { to_status: string; note: string | null; created_at: string; profiles: { full_name: string | null } | null };
  const hist = (history ?? []) as unknown as Hist[];
  const reached = (s: string) => hist.find((h) => h.to_status === s)?.created_at ?? (s === "pending" ? o.created_at : null);
  const terminal = ["cancelled", "refunded"].includes(o.status) ? o.status : null;

  return (
    <>
      <Link href="/admin/orders" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Orders</Link>
      <PageTitle
        title={`Order ${o.reference}`}
        description={`Placed ${fmt(o.created_at)}`}
        actions={<><StatusBadge status={payment?.status ?? "pending"} label={`Payment: ${(payment?.status ?? "pending").replace(/_/g, " ")}`} /><StatusBadge status={o.status} label={o.status === "paid" ? "Pending" : undefined} /></>}
      />

      {o.needs_attention && (
        <p role="alert" className="mb-5 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Needs attention: {o.attention_reason}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="-my-2 divide-y divide-ink/5">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#F5F6F8]">
                    {i.image_url && <Image src={i.image_url} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {i.product_id ? <Link href={`/admin/products/${i.product_id}`} className="font-semibold hover:text-brand">{i.product_name}</Link> : <span className="font-semibold">{i.product_name}</span>}
                    <span className="block text-xs text-ink/50">{[i.variant_name, i.sku && `SKU ${i.sku}`].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="text-right text-sm tabular-nums">
                    <span className="block text-ink/55">{i.quantity} × {formatPrice(i.unit_price)}</span>
                    <span className="font-bold">{formatPrice(i.line_total)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-sm">
              <Row label="Subtotal" value={formatPrice(o.subtotal)} />
              {o.discount_total > 0 && <Row label={`Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`} value={`−${formatPrice(o.discount_total)}`} />}
              <Row label={`Delivery · ${o.delivery_method_label}`} value={formatPrice(o.delivery_fee)} />
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(o.total)}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Customer">
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={o.full_name} />
                <Row label="Email" value={<a href={`mailto:${o.email}`} className="text-brand hover:underline">{o.email}</a>} />
                <Row label="Phone" value={<a href={`tel:${o.phone}`} className="text-brand hover:underline">{o.phone}</a>} />
                <Row label="Account" value={o.user_id ? "Registered customer" : "Guest checkout"} />
              </dl>
            </Card>
            <Card title="Delivery address">
              <address className="space-y-0.5 text-sm not-italic">
                <p className="font-semibold">{o.full_name}</p>
                <p>{o.address_line}</p>
                <p>{o.city}, {o.state}</p>
                {o.instructions && <p className="mt-2 rounded-lg bg-ink/[0.03] p-2 text-ink/70">“{o.instructions}”</p>}
              </address>
              {o.tracking_number && (
                <p className="mt-3 text-sm"><span className="font-semibold">Tracking:</span> {o.tracking_number} {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">Open <ExternalLink className="size-3" /></a>}</p>
              )}
            </Card>
          </div>

          <Card title="Payment">
            {payment ? (
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Provider" value={<span className="capitalize">{payment.provider}</span>} />
                <Row label="Status" value={<StatusBadge status={payment.status} />} />
                <Row label="Reference" value={<span className="font-mono text-xs">{payment.reference}</span>} />
                <Row label="Amount" value={formatPrice(payment.amount)} />
                <Row label="Channel" value={payment.channel ?? "—"} />
                <Row label="Paid" value={fmt(payment.paid_at) || "—"} />
                {payment.refunded_amount > 0 && <Row label="Refunded" value={formatPrice(payment.refunded_amount)} />}
              </dl>
            ) : (
              <p className="text-sm text-ink/55">No payment has been started for this order.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Timeline">
            <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-0.5 before:bg-ink/10">
              {STEPS.map((s) => {
                const at = reached(s);
                return (
                  <li key={s} className="relative flex gap-3">
                    <span className={`relative mt-0.5 size-6 shrink-0 rounded-full border-2 ${at ? "border-brand bg-brand" : "border-ink/20 bg-white"}`} aria-hidden="true" />
                    <span>
                      <span className={`block text-sm font-bold ${at ? "" : "text-ink/40"}`}>{STEP_LABEL[s]}</span>
                      {at && <span className="text-xs text-ink/50">{fmt(at)}</span>}
                    </span>
                  </li>
                );
              })}
              {terminal && (
                <li className="relative flex gap-3">
                  <span className="relative mt-0.5 size-6 shrink-0 rounded-full border-2 border-red-500 bg-red-500" aria-hidden="true" />
                  <span><span className="block text-sm font-bold text-red-700">{STEP_LABEL[terminal]}</span><span className="text-xs text-ink/50">{fmt(reached(terminal))}</span></span>
                </li>
              )}
            </ol>
            {hist.some((h) => h.note) && (
              <ul className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-xs text-ink/60">
                {hist.filter((h) => h.note).map((h, i) => (
                  <li key={i}><span className="font-semibold text-ink">{STEP_LABEL[h.to_status]}:</span> {h.note}{h.profiles?.full_name ? ` · ${h.profiles.full_name}` : ""}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Actions">
            <OrderActionsPanel
              orderId={o.id}
              status={o.status}
              paid={!!o.paid_at}
              refundable={refundable}
              tracking={{ number: o.tracking_number ?? "", url: o.tracking_url ?? "" }}
            />
          </Card>

          <Card title="Internal notes">
            {(notes ?? []).length === 0 ? (
              <p className="text-sm text-ink/50">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {(notes as unknown as { id: number; body: string; created_at: string; profiles: { full_name: string | null } | null }[]).map((n) => (
                  <li key={n.id} className="rounded-lg bg-ink/[0.03] p-3 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-ink/45">{n.profiles?.full_name ?? "Staff"} · {fmt(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/55">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
