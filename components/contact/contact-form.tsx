"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { Info, Send } from "lucide-react";
import { sendContactMessage, type ContactState } from "@/lib/contact/actions";
import { TextField } from "@/components/forms/form-bits";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, { status: "idle" } as ContactState);
  const values = state.status === "idle" ? {} : state.values;
  const errors = state.status === "invalid" ? state.errors : {};

  return (
    <form action={action} noValidate className="rounded-[32px] border-[3px] border-ink bg-white p-7 shadow-[0_8px_0_0_#1b1b1b] sm:p-9">
      <h2 className="font-display text-2xl font-semibold">Send us a message</h2>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" autoComplete="name" defaultValue={values.name} error={errors.name} />
        <TextField label="Email address" name="email" type="email" autoComplete="email" defaultValue={values.email} error={errors.email} />
        <TextField label="Order reference" name="orderRef" optional defaultValue={values.orderRef} className="sm:col-span-2" />
        <TextField label="Message" name="message" multiline defaultValue={values.message} error={errors.message} className="sm:col-span-2" />
      </div>

      {state.status === "unavailable" && (
        <p role="alert" className="mt-5 flex gap-2 rounded-2xl bg-[#E6F1FB] px-4 py-3 text-sm font-semibold text-[#1F4E86]">
          <Info className="size-5 shrink-0" />
          Thanks! Our message inbox isn&apos;t connected yet, so this wasn&apos;t sent. Please try again soon.
        </p>
      )}

      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ y: -2 }}
        whileTap={{ y: 4 }}
        className="mt-7 inline-flex h-13 items-center gap-2 rounded-xl bg-coral px-8 py-3.5 text-[15px] font-bold text-white shadow-pop disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send message"} <Send className="size-4" />
      </motion.button>
    </form>
  );
}
