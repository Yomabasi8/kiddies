import type { Metadata } from "next";
import { AuthShell } from "@/components/admin/auth-shell";
import { SetPasswordForm } from "@/components/admin/set-password-form";

export const metadata: Metadata = { title: "Set your password", robots: { index: false, follow: false } };

export default function SetPasswordPage() {
  return (
    <AuthShell title="Choose your password" subtitle="You'll use this with your email to sign in to the admin.">
      <SetPasswordForm />
    </AuthShell>
  );
}
