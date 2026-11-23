"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { signIn, type LoginState } from "@/lib/auth/actions";
import { adminButton, adminInput } from "./auth-shell";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next: Promise<string> }) {
  const nextPath = use(next);
  const [state, action, pending] = useActionState(signIn, { status: "idle" } as LoginState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.status === "error" ? state.email : ""} className={adminInput} />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-bold">Password</label>
          <Link href="/admin/forgot-password" className="text-sm font-semibold text-brand hover:underline">Forgot password?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      {state.status === "error" && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          <AlertCircle className="size-4" /> {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={adminButton}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
