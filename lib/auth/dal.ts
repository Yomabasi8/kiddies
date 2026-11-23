import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Data Access Layer for admin authorisation. The proxy only does an
 * optimistic redirect; THIS is the security boundary. Every admin page and
 * server action must call requireStaff() (or requireAdmin()).
 */

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: "staff" | "admin";
};

/** The signed-in staff member, or null. Deduplicated per request. */
export const getCurrentStaff = cache(async (): Promise<StaffUser | null> => {
  const supabase = await createSessionClient();
  // getUser() verifies the token with Supabase Auth (not just decodes it).
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: profile.full_name || data.user.email?.split("@")[0] || "Admin",
    role: profile.role,
  };
});

export async function requireStaff(): Promise<StaffUser> {
  const user = await getCurrentStaff();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdmin(): Promise<StaffUser> {
  const user = await requireStaff();
  if (user.role !== "admin") redirect("/admin/dashboard?denied=1");
  return user;
}

/** Record an admin action in the audit log. Never throws. */
export async function audit(actor: StaffUser, action: string, entityType: string, entityId: string | null, details: Record<string, unknown> = {}) {
  await createAdminClient()
    .from("audit_logs")
    .insert({ actor_id: actor.id, action, entity_type: entityType, entity_id: entityId, details })
    .then(() => undefined, () => undefined);
}
