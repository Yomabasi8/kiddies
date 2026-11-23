"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, CreditCard, Home, Package, Search, Truck } from "lucide-react";
import { trackOrder, type TrackState } from "@/lib/orders/actions";
import { TextField } from "@/components/forms/form-bits";

const STEPS = [
  { label: "Order placed", Icon: CheckCircle2 },
  { label: "Payment confirmed", Icon: CreditCard },
  { label: "Processing", Icon: Package },
  { label: "Dispatched", Icon: Truck },
  { label: "Delivered", Icon: Home },
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
          <TextField label="Order reference" name="reference" placeholder="e.g. KA-7F3K9Q" defaultValue={v.reference} autoComplete="off" className="[&_input]:uppercase" />
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
            We couldn&apos;t find an order matching those details. Check the reference in your confirmation email and use the same email or phone number you checked out with.
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

      <div>
        <h2 className="font-display text-2xl font-semibold">What you&apos;ll see</h2>
        <p className="mt-1.5 text-[15px] text-ink/60">Your order moves through these steps. We&apos;ll keep the timeline up to date.</p>
        <ol className="relative mt-8 space-y-7 before:absolute before:bottom-4 before:left-6 before:top-4 before:w-[3px] before:rounded-full before:bg-ink/10">
          {STEPS.map(({ label, Icon }, i) => (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 140, damping: 16 }}
              className="relative flex items-center gap-4"
            >
              <span className="relative grid size-12 place-items-center rounded-full border-[3px] border-ink bg-sunny">
                <Icon className="size-5" />
              </span>
              <span className="font-bold">{label}</span>
            </motion.li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-ink/50">Cancelled and refunded orders are shown here too.</p>
      </div>
    </div>
  );
}
