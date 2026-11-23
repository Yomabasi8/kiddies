"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { adminButton } from "./auth-shell";
import { PasswordInput } from "./password-input";

/**
 * Landing page for invite and password-reset emails. Supabase redirects here
 * with session tokens in the URL fragment (never sent to our server); we
 * exchange them for a cookie session, then let the user set a password.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Drop tokens from the address bar and history straight away.
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);

    (async () => {
      if (hash.get("error")) return setPhase("invalid");
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        return setPhase(error ? "invalid" : "ready");
      }
      // Already signed in (e.g. page refresh after the exchange).
      const { data } = await supabase.auth.getUser();
      setPhase(data.user ? "ready" : "invalid");
    })();
  }, []);

  const rules = [
    { ok: password.length >= 10, label: "At least 10 characters" },
    { ok: /[a-z]/i.test(password) && /\d/.test(password), label: "Letters and numbers" },
    { ok: password.length > 0 && password === confirm, label: "Passwords match" },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rules.every((r) => r.ok)) return setError("Please meet all the password requirements.");
    setSaving(true);
    setError("");
    const { error } = await createBrowserSupabase().auth.updateUser({ password });
    setSaving(false);
    if (error) return setError(error.message);
    router.replace("/admin/dashboard");
  }

  if (phase === "checking") return <p className="text-sm text-ink/60">Checking your link…</p>;
  if (phase === "invalid") {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-6">
        <p className="flex items-center gap-2 font-bold text-red-700"><AlertCircle className="size-5" /> This link is invalid or has expired</p>
        <p className="mt-2 text-sm text-ink/60">Links can only be used once and expire after a while. Request a new one below.</p>
        <Link href="/admin/forgot-password" className={cn(adminButton, "mt-5")}>Send a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold">New password</label>
        <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-bold">Confirm password</label>
        <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <ul className="space-y-1.5 text-sm" aria-label="Password requirements">
        {rules.map((r) => (
          <li key={r.label} className={cn("flex items-center gap-2", r.ok ? "text-brand" : "text-ink/50")}>
            {r.ok ? <Check className="size-4" /> : <X className="size-4" />} {r.label}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}
      <button type="submit" disabled={saving} className={adminButton}>{saving ? "Saving…" : "Save password and continue"}</button>
    </form>
  );
}
