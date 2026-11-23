"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send } from "lucide-react";
import { subscribeToNewsletter, type NewsletterState } from "@/lib/newsletter/actions";
import { cn } from "@/lib/utils";

const initial: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const invalid = state.status === "invalid";

  return (
    <form action={action} noValidate className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Your email address"
          aria-invalid={invalid || undefined}
          aria-describedby="newsletter-status"
          className={cn(
            "h-14 w-full min-w-0 rounded-full sm:flex-1 bg-ink px-6 text-[15px] text-white placeholder:text-white/50 outline-none ring-sunny transition-shadow focus-visible:ring-4",
            invalid && "ring-4 ring-white",
          )}
        />
        <motion.button
          type="submit"
          disabled={pending}
          whileHover={{ y: -2 }}
          whileTap={{ y: 3 }}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-sunny px-8 text-[15px] font-extrabold uppercase tracking-wide text-ink shadow-pop disabled:opacity-70"
        >
          {pending ? "Signing up…" : "Sign up"}
          <Send className="size-4" />
        </motion.button>
      </div>
      <div id="newsletter-status" aria-live="polite" className="min-h-6">
        <AnimatePresence mode="wait">
          {state.status !== "idle" && (
            <motion.p
              key={state.message}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 pl-2 text-sm font-semibold text-white"
            >
              {state.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
