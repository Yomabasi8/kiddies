import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/admin/auth-shell";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <AuthShell title="Sign in" subtitle="Use your admin email and password.">
      <Suspense>
        <LoginForm next={searchParams.then((s) => (typeof s.next === "string" ? s.next : ""))} />
      </Suspense>
    </AuthShell>
  );
}
