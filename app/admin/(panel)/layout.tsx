import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Kiddies Accessories" },
  robots: { index: false, follow: false },
};

// Admin pages always render per request for the signed-in staff member.
export const instant = false;

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  const db = createAdminClient();
  const [{ data: notifications }, { data: store }] = await Promise.all([
    db.from("notifications").select("id, title, body, created_at").is("read_at", null).order("created_at", { ascending: false }).limit(10),
    db.from("store_settings").select("store_closed").eq("id", 1).maybeSingle(),
  ]);

  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} notifications={notifications ?? []} storeClosed={!!store?.store_closed}>
      {children}
    </AdminShell>
  );
}
