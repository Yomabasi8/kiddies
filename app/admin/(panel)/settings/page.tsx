import type { Metadata } from "next";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Card, PageTitle } from "@/components/admin/ui";
import { AccountPanel, BusinessForm, DeliveryMethodsEditor, NotificationsForm } from "@/components/admin/settings-forms";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Store Settings" };
export const instant = false;

/** Describe the Paystack setup without ever exposing a key. */
function paystackStatus() {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const pub = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
  if (!secret || !pub) return { ok: false, label: "Not connected", detail: "Add your Paystack keys to the server's environment settings." };
  const mode = secret.startsWith("sk_live_") ? "Live" : secret.startsWith("sk_test_") ? "Test" : null;
  if (!mode) return { ok: false, label: "Key format not recognised", detail: "The secret key should start with sk_test_ or sk_live_." };
  return { ok: true, label: `Keys added · ${mode} mode`, detail: mode === "Test" ? "Test mode: no real money is charged." : "Live mode: real payments are taken." };
}

export default async function SettingsPage() {
  const user = await requireStaff();
  const isAdmin = user.role === "admin";
  const db = createAdminClient();
  const [{ data: s }, { data: methods }] = await Promise.all([
    db.from("store_settings").select("*").eq("id", 1).single(),
    db.from("delivery_methods").select("*").order("sort_order"),
  ]);
  const socials = (s?.socials ?? {}) as Record<string, string>;
  const pay = paystackStatus();

  return (
    <>
      <PageTitle title="Store Settings" description={isAdmin ? "Business details, delivery, payments and your account." : "Some settings can only be changed by an administrator."} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Business information">
            <BusinessForm
              canEdit={isAdmin}
              initial={{ store_name: s?.store_name ?? "", email: s?.email ?? "", phone: s?.phone ?? "", whatsapp: s?.whatsapp ?? "", address: s?.address ?? "", instagram: socials.instagram ?? "", facebook: socials.facebook ?? "", tiktok: socials.tiktok ?? "", x: socials.x ?? "" }}
            />
          </Card>
          <Card title="Delivery">
            <DeliveryMethodsEditor
              canEdit={isAdmin}
              methods={(methods ?? []).map((m) => ({ id: m.id, label: m.label, description: m.description, fee: String(m.fee / 100), states: m.states, isActive: m.is_active, sortOrder: String(m.sort_order) }))}
            />
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Payments">
            <p className="text-sm font-bold">Paystack</p>
            <p className={`mt-2 flex items-center gap-2 text-sm font-semibold ${pay.ok ? "text-emerald-700" : "text-amber-700"}`}>
              {pay.ok ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />} {pay.label}
            </p>
            <p className="mt-1 text-xs text-ink/55">{pay.detail}</p>
            <p className="mt-3 text-xs text-ink/55">Accepted methods are managed in your Paystack dashboard (cards, bank transfer, USSD and more). Keys are kept in server settings and never shown here.</p>
          </Card>
          <Card title="Notifications">
            <NotificationsForm canEdit={isAdmin} initial={{ notify_new_orders: s?.notify_new_orders, notify_payments: s?.notify_payments, notify_low_stock: s?.notify_low_stock, notify_order_status: s?.notify_order_status }} />
          </Card>
          <Card title="Your account">
            <AccountPanel email={user.email} />
          </Card>
        </div>
      </div>
    </>
  );
}
