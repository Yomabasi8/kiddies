"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Home, Package, RotateCcw, Search, Truck, XCircle } from "lucide-react";
import { trackOrder, type TrackState, type TrackedOrder } from "@/lib/orders/actions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/forms/form-bits";

const STEPS = [
  { key: "pending", label: "Order placed", Icon: CheckCircle2 },
  { key: "paid", label: "Payment confirmed", Icon: CreditCard },
  { key: "processing", label: "Processing", Icon: Package },
  { key: "dispatched", label: "Dispatched", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: Home },
];

export function TrackOrderForm() {
  const [state, action, pending] = useActionState(trackOrder, { status: "idle" } as TrackState);
  const v = state.status === "idle" ? { reference: "", contact: "" } : state;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <form action={action} noValidate className="h-fit rounded-[32px] border-[3px] border-ink bg-white p-7 shadow-[0_8px_0_0_#1b1b1b] sm:p-9">
        <h2 className="font-display text-2xl font-semibold">Find your order</h2>
        <p className="mt-1.5 text-[15px] text-ink/60">Enter your order reference and the email or phone number you used at checkout.</p>
        <div className="mt-7 space-y-5">
          <TextField label="Order reference" name="reference" placeholder="e.g. KA-7F3K9Q2D" defaultValue={v.reference} autoComplete="off" className="[&_input]:uppercase" />
          <TextField label="Email or phone number" name="contact" defaultValue={v.contact} autoComplete="email" />
        </div>

        {state.status === "invalid" && (
          <p role="alert" className="mt-5 flex gap-2 rounded-2xl bg-[#FFEDE6] px-4 py-3 text-sm font-semibold text-[#9C3A20]">
            <AlertCircle className="size-5 shrink-0" /> {state.message}
          </p>
        )}
        {state.status === "not_found" && (
          <p role="alert" className="mt-5 flex gap-2 rounded-2xl bg-[#FFF6D9] px-4 py-3 text-sm font-semibold text-[#7A5600]">
            <AlertCircle className="size-5 shrink-0" />
            We couldn&apos;t find an order matching those details. Check the reference in your confirmation and use the same email or phone number you checked out with.
          </p>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          whileHover={{ y: -2 }}
          whileTap={{ y: 4 }}
          className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-coral py-3.5 text-[15px] font-bold text-white shadow-pop disabled:opacity-70"
        >
          <Search className="size-4" /> {pending ? "Looking…" : "Track order"}
        </motion.button>
      </form>

      {state.status === "found" ? <Result order={state.order} /> : <Preview />}
    </div>
  );
}

function Result({ order }: { order: TrackedOrder }) {
  const reached = new Map(order.timeline.map((t) => [t.status, t.at]));
  const closed = order.status === "cancelled" || order.status === "refunded" ? order.status : null;
  const fmt = (d: string) => new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} role="status">
      <p className="text-sm font-semibold text-ink/50">Order</p>
      <h2 className="font-mono text-2xl font-bold">{order.reference}</h2>
      <p className="mt-1 text-sm text-ink/60">
        Placed {fmt(order.placedAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {formatPrice(order.total)} · {order.deliveryArea}
      </p>

      <ol className="relative mt-8 space-y-6 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-[3px] before:rounded-full before:bg-ink/10">
        {STEPS.map(({ key, label, Icon }, i) => {
          const at = reached.get(key);
          return (
            <motion.li key={key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative flex items-center gap-4">
              <span className={cn("relative grid size-12 place-items-center rounded-full border-[3px]", at ? "border-ink bg-sunny" : "border-ink/15 bg-white text-ink/30")}>
                <Icon className="size-5" />
              </span>
              <span>
                <span className={cn("block font-bold", !at && "text-ink/40")}>{label}</span>
                {at && <span className="text-xs text-ink/50">{fmt(at)}</span>}
              </span>
            </motion.li>
          );
        })}
        {closed && (
          <li className="relative flex items-center gap-4">
            <span className="relative grid size-12 place-items-center rounded-full border-[3px] border-ink bg-[#FFEDE6] text-coral">
              {closed === "refunded" ? <RotateCcw className="size-5" /> : <XCircle className="size-5" />}
            </span>
            <span><span className="block font-bold capitalize">{closed}</span>{reached.get(closed) && <span className="text-xs text-ink/50">{fmt(reached.get(closed)!)}</span>}</span>
          </li>
        )}
      </ol>

      {order.trackingNumber && (
        <p className="mt-8 rounded-2xl bg-[#FDF8E9] px-5 py-4 text-sm">
          <span className="font-bold">Tracking number:</span> {order.trackingNumber}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-bold text-brand hover:underline">
              Track delivery <ExternalLink className="size-3.5" />
            </a>
          )}
        </p>
      )}
    </motion.div>
  );
}

function Preview() {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">What you&apos;ll see</h2>
      <p className="mt-1.5 text-[15px] text-ink/60">Your order moves through these steps, and we keep the timeline up to date.</p>
      <ol className="relative mt-8 space-y-7 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-[3px] before:rounded-full before:bg-ink/10">
        {STEPS.map(({ label, Icon }, i) => (
          <motion.li key={label} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 140, damping: 16 }} className="relative flex items-center gap-4">
            <span className="relative grid size-12 place-items-center rounded-full border-[3px] border-ink bg-sunny"><Icon className="size-5" /></span>
            <span className="font-bold">{label}</span>
          </motion.li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-ink/50">Cancelled and refunded orders are shown here too.</p>
    </div>
  );
}
