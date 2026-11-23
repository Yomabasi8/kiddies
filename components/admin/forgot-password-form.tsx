"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, MailCheck } from "lucide-react";
import { requestPasswordReset, type ResetState } from "@/lib/auth/actions";
import { adminButton, adminInput } from "./auth-shell";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, { status: "idle" } as ResetState);

  if (state.status === "sent") {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-6 text-center">
        <MailCheck className="mx-auto size-8 text-brand" />
        <p className="mt-3 font-bold">Check your inbox</p>
        <p className="mt-1 text-sm text-ink/60">If that email belongs to an admin account, a reset link is on its way.</p>
        <Link href="/admin/login" className="mt-5 inline-block text-sm font-bold text-brand hover:underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={adminInput} />
      </div>
      {state.status === "error" && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          <AlertCircle className="size-4" /> {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={adminButton}>{pending ? "Sending…" : "Send reset link"}</button>
      <Link href="/admin/login" className="block text-center text-sm font-semibold text-ink/60 hover:text-ink">Back to sign in</Link>
    </form>
  );
}
