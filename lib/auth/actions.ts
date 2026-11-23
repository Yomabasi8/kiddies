"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginState = { status: "idle" } | { status: "error"; message: string; email: string };
export type ResetState = { status: "idle" } | { status: "sent" } | { status: "error"; message: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Only allow redirects back into the admin area. */
function safeNext(next: FormDataEntryValue | null) {
  const n = String(next ?? "");
  return n.startsWith("/admin/") && !n.startsWith("//") ? n : "/admin/dashboard";
}

export async function signIn(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  // One message for every failure, so the form doesn't reveal which admin
  // emails exist. Supabase Auth also rate-limits sign-in attempts.
  const fail: LoginState = { status: "error", message: "Incorrect email or password.", email };
  if (!email || !password) return fail;

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return fail;

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.role !== "staff" && profile?.role !== "admin") {
    // Valid customer account but not staff: don't leave them signed in here.
    await supabase.auth.signOut();
    return fail;
  }

  redirect(safeNext(fd.get("next")));
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  const supabase = await createSessionClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE}/admin/set-password` });
  // Same response whether or not the account exists.
  return { status: "sent" };
}
