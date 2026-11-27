import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONTACT_URL, EXTERNAL_LINK } from "@/lib/contact";
import { Suspense } from "react";
import { CheckCircle2, Clock, Package, RefreshCw, XCircle } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { ClearCartOnSuccess } from "@/components/orders/clear-cart";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function OrderConfirmedPage({ searchParams }: PageProps<"/order/confirmed">) {
  return (
    <main className="flex-1">
      <PageHeader title="Your Order" crumbs={[{ href: "/", label: "Home" }, { label: "Order" }]} />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-[32px] bg-ink/[0.04]" />}>
          <OrderResult searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

type Item = { product_name: string; image_url: string | null; quantity: number; line_total: number };

/**
 * Shows the outcome for a payment reference. The reference is a random,
 * unguessable value only the payer receives; even so, only non-sensitive
 * details are shown (first name, items, totals, city/state).
 */
async function OrderResult({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const valid = /^KAP-[A-Z0-9]{12,32}$/.test(ref);
  const { data: payment } = valid
    ? await createAdminClient()
        .from("payments")
        .select("status, orders(reference, full_name, city, state, subtotal, discount_total, delivery_fee, total, delivery_method_label, status, order_items(product_name, image_url, quantity, line_total))")
        .eq("reference", ref)
        .maybeSingle()
    : { data: null };

  if (!payment) {
    return (
      <Panel Icon={XCircle} tone="coral" title="We couldn't find that payment" text="If you completed a payment, check your email for your order reference, or contact us and we'll help.">
        <Link href={CONTACT_URL} {...EXTERNAL_LINK} className={primary}>Contact us</Link>
      </Panel>
    );
  }

  const order = payment.orders as unknown as {
    reference: string; full_name: string; city: string; state: string; subtotal: number; discount_total: number;
    delivery_fee: number; total: number; delivery_method_label: string; status: string; order_items: Item[];
  };
  const paid = ["success", "partially_refunded", "refunded"].includes(payment.status);

  if (payment.status === "pending") {
    return (
      <Panel Icon={Clock} tone="butter" title="We're confirming your payment" text="This usually takes a few seconds. If you've paid, don't pay again. Check this page again shortly.">
        <a href={`/api/checkout/callback?reference=${encodeURIComponent(ref)}`} className={primary}><RefreshCw className="size-4" /> Check again</a>
        <p className="mt-4 text-sm text-ink/55">Order reference: <strong className="font-mono">{order.reference}</strong></p>
      </Panel>
    );
  }

  if (!paid) {
    return (
      <Panel Icon={XCircle} tone="coral" title="Your payment didn't go through" text="No money was taken. Your cart is still saved, so you can try again whenever you're ready.">
        <Link href="/checkout" className={primary}>Try again</Link>
      </Panel>
    );
  }

  const firstName = order.full_name.split(" ")[0];
  return (
    <>
      <ClearCartOnSuccess />
      <Panel Icon={CheckCircle2} tone="mint" title={`Thank you, ${firstName}!`} text="Your payment was successful and your order is confirmed.">
        <p className="rounded-2xl bg-white px-5 py-3 text-sm">
          Order reference <strong className="ml-1 font-mono text-base">{order.reference}</strong>
        </p>
      </Panel>

      <section className="mt-8 rounded-[28px] border-[3px] border-ink bg-white p-6 shadow-[0_8px_0_0_#1b1b1b] sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {order.order_items.map((i, n) => (
            <li key={n} className="flex items-center gap-4">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-[#F5F6F8]">
                {i.image_url && <Image src={i.image_url} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />}
              </span>
              <span className="flex-1 text-sm font-bold">{i.product_name} <span className="font-semibold text-ink/50">× {i.quantity}</span></span>
              <span className="text-sm font-extrabold">{formatPrice(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t-2 border-ink/10 pt-5 text-[15px]">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount_total > 0 && <Row label="Discount" value={`−${formatPrice(order.discount_total)}`} />}
          <Row label={order.delivery_method_label} value={formatPrice(order.delivery_fee)} />
          <div className="flex justify-between border-t-2 border-ink/10 pt-3 text-lg font-extrabold"><dt className="font-display font-semibold">Total paid</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-ink/60">Delivering to {order.city}, {order.state}.</p>
      </section>

      <section className="mt-8 rounded-[28px] bg-[#FDF8E9] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Package className="size-5" /> What happens next</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-ink/75">
          <li>We prepare your order and pack it with care.</li>
          <li>We dispatch it and update your order status.</li>
          <li>Track it any time with your order reference and the email or phone you used.</li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/track-order" className={primary}>Track your order</Link>
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full border-2 border-ink px-6 text-sm font-bold hover:bg-ink hover:text-white">Keep shopping</Link>
        </div>
      </section>
    </>
  );
}

const primary = "inline-flex h-12 items-center gap-2 rounded-full bg-coral px-7 text-sm font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5";

function Panel({ Icon, tone, title, text, children }: { Icon: typeof CheckCircle2; tone: "mint" | "coral" | "butter"; title: string; text: string; children?: React.ReactNode }) {
  const tones = { mint: "bg-[#E3F5EF] text-brand", coral: "bg-[#FFEDE6] text-coral", butter: "bg-[#FFF6D9] text-[#9A6400]" };
  return (
    <section className="flex flex-col items-center rounded-[32px] bg-[#FDF8E9] px-6 py-12 text-center">
      <span className={`grid size-20 place-items-center rounded-full ${tones[tone]}`}><Icon className="size-10" /></span>
      <h1 className="mt-5 font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-md text-[15px] text-ink/65">{text}</p>
      {children && <div className="mt-6 flex flex-col items-center">{children}</div>}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink/65">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
