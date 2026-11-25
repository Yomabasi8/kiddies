"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LogOut, Plus } from "lucide-react";
import {
  saveBusinessInfo,
  saveDeliveryMethod,
  saveNotifications,
  saveOfferAndPickup,
  signOutEverywhere,
  type DeliveryInput,
  type SettingsResult,
} from "@/lib/admin/settings-actions";
import { NIGERIAN_STATES } from "@/lib/delivery";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { PasswordInput } from "./password-input";
import { btn, field } from "./ui";

function Result({ r }: { r: SettingsResult | null }) {
  if (!r) return null;
  return (
    <p role="status" className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold", r.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
      {r.ok && <CheckCircle2 className="size-4" />} {r.message}
    </p>
  );
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}

export function BusinessForm({ initial, canEdit }: { initial: Record<string, string>; canEdit: boolean }) {
  const [v, setV] = useState(initial);
  const [r, setR] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  const input = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <L label={label}>
      <input className={field} value={v[k] ?? ""} disabled={!canEdit} onChange={(e) => setV({ ...v, [k]: e.target.value })} {...props} />
    </L>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setR(await saveBusinessInfo(v))); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {input("store_name", "Store name")}
        {input("email", "Business email", { type: "email" })}
        {input("phone", "Phone number", { type: "tel" })}
        {input("whatsapp", "WhatsApp number", { type: "tel" })}
      </div>
      <L label="Business address"><textarea className={cn(field, "h-20 py-2")} value={v.address ?? ""} disabled={!canEdit} onChange={(e) => setV({ ...v, address: e.target.value })} /></L>
      <p className="pt-2 text-sm font-bold">Social media links</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {input("instagram", "Instagram", { placeholder: "https://instagram.com/…" })}
        {input("facebook", "Facebook", { placeholder: "https://facebook.com/…" })}
        {input("tiktok", "TikTok", { placeholder: "https://tiktok.com/@…" })}
        {input("x", "X (Twitter)", { placeholder: "https://x.com/…" })}
      </div>
      <Result r={r} />
      {canEdit ? <button type="submit" disabled={pending} className={btn.primary}>{pending ? "Saving…" : "Save business details"}</button> : <p className="text-xs text-ink/50">Only administrators can change these.</p>}
    </form>
  );
}

const NOTIFY = [
  ["notify_new_orders", "New orders"],
  ["notify_payments", "Payments received"],
  ["notify_low_stock", "Low-stock alerts"],
  ["notify_order_status", "Order status changes"],
] as const;

export function NotificationsForm({ initial, canEdit }: { initial: Record<string, boolean>; canEdit: boolean }) {
  const [v, setV] = useState(initial);
  const [r, setR] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setR(await saveNotifications(v))); }} className="space-y-3">
      {NOTIFY.map(([k, label]) => (
        <label key={k} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm font-semibold">
          {label}
          <input type="checkbox" role="switch" checked={!!v[k]} disabled={!canEdit} onChange={(e) => setV({ ...v, [k]: e.target.checked })} className="size-5 accent-[#086f54]" />
        </label>
      ))}
      <p className="text-xs text-ink/50">These appear in the admin notification bell. Email alerts can be added once an email service is connected.</p>
      <Result r={r} />
      {canEdit && <button type="submit" disabled={pending} className={btn.secondary}>{pending ? "Saving…" : "Save preferences"}</button>}
    </form>
  );
}

export function DeliveryMethodsEditor({ methods, canEdit }: { methods: DeliveryInput[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<DeliveryInput | null>(null);
  const [r, setR] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    start(async () => {
      const res = await saveDeliveryMethod(editing);
      setR(res);
      if (res.ok) setEditing(null);
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-ink/5 rounded-lg border border-ink/10">
        {methods.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-semibold">{m.label} {!m.isActive && <span className="ml-1 rounded bg-ink/5 px-1.5 text-xs text-ink/50">Off</span>}</p>
              <p className="text-xs text-ink/55">{m.description} · {m.states === null ? "Nationwide" : m.states.join(", ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold tabular-nums">₦{Number(m.fee).toLocaleString("en-NG")}</span>
              {canEdit && <button type="button" onClick={() => { setR(null); setEditing(m); }} className={btn.ghost}>Edit</button>}
            </div>
          </li>
        ))}
      </ul>
      {canEdit && !editing && (
        <button type="button" onClick={() => { setR(null); setEditing({ label: "", description: "", fee: "", states: null, isActive: true, sortOrder: String(methods.length) }); }} className={btn.secondary}>
          <Plus className="size-4" /> Add delivery option
        </button>
      )}
      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-lg bg-ink/[0.03] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Name"><input className={field} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. Express (Lagos)" /></L>
            <L label="Fee (₦)" hint="0 for free delivery"><input className={field} inputMode="decimal" value={editing.fee} onChange={(e) => setEditing({ ...editing, fee: e.target.value })} /></L>
          </div>
          <L label="Estimated delivery time"><input className={field} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="e.g. Estimated 1–3 business days" /></L>
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold">Where it&apos;s available</legend>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.states === null} onChange={(e) => setEditing({ ...editing, states: e.target.checked ? null : [] })} className="size-4 accent-[#086f54]" /> Nationwide (all states)
            </label>
            {editing.states !== null && (
              <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-ink/10 bg-white p-2 sm:grid-cols-3">
                {NIGERIAN_STATES.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-ink/5">
                    <input type="checkbox" checked={editing.states!.includes(s)} onChange={(e) => setEditing({ ...editing, states: e.target.checked ? [...editing.states!, s] : editing.states!.filter((x) => x !== s) })} className="size-4 accent-[#086f54]" />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="size-4 accent-[#086f54]" /> Offer this option at checkout
          </label>
          <Result r={r} />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={btn.primary}>{pending ? "Saving…" : "Save option"}</button>
            <button type="button" onClick={() => setEditing(null)} className={btn.secondary}>Cancel</button>
          </div>
        </form>
      )}
      {!editing && <Result r={r} />}
    </div>
  );
}

export function AccountPanel({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [r, setR] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();

  function change(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 10 || !/[a-z]/i.test(next) || !/\d/.test(next)) {
      return setR({ ok: false, message: "Use at least 10 characters with letters and numbers." });
    }
    start(async () => {
      const supabase = createBrowserSupabase();
      // Confirm the current password before changing it.
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (authError) return setR({ ok: false, message: "Your current password is incorrect." });
      const { error } = await supabase.auth.updateUser({ password: next });
      setR(error ? { ok: false, message: error.message } : { ok: true, message: "Password changed." });
      if (!error) { setCurrent(""); setNext(""); }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={change} className="space-y-4">
        <p className="text-sm text-ink/60">Signed in as <strong className="text-ink">{email}</strong></p>
        <L label="Current password"><PasswordInput id="current-password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></L>
        <L label="New password" hint="At least 10 characters, letters and numbers"><PasswordInput id="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></L>
        <Result r={r} />
        <button type="submit" disabled={pending || !current || !next} className={btn.primary}>{pending ? "Changing…" : "Change password"}</button>
      </form>
      <div className="border-t border-ink/10 pt-5">
        <p className="text-sm font-bold">Sessions</p>
        <p className="mt-1 text-xs text-ink/55">Signs you out on this and every other device. Use it if you think someone else has access.</p>
        <form action={signOutEverywhere} className="mt-3">
          <button type="submit" className={btn.secondary}><LogOut className="size-4" /> Sign out everywhere</button>
        </form>
      </div>
    </div>
  );
}

export function OfferPickupForm({ initial, canEdit }: { initial: { offerOn: boolean; days: string; pickupAddress: string; pickupHours: string }; canEdit: boolean }) {
  const [v, setV] = useState(initial);
  const [r, setR] = useState<SettingsResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setR(await saveOfferAndPickup(v))); }} className="space-y-4">
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
        Free delivery for new customers
        <input type="checkbox" role="switch" checked={v.offerOn} disabled={!canEdit} onChange={(e) => setV({ ...v, offerOn: e.target.checked })} className="size-5 accent-[#086f54]" />
      </label>
      {v.offerOn && (
        <L label="For how many days?" hint="Counted from each customer's first paid order. They're recognised by email or phone.">
          <input className={field} inputMode="numeric" value={v.days} disabled={!canEdit} onChange={(e) => setV({ ...v, days: e.target.value.replace(/\D/g, "") })} />
        </L>
      )}
      <div className="border-t border-ink/10 pt-4">
        <L label="Pickup address" hint="Customers can choose free pickup once this is filled in.">
          <textarea className={cn(field, "h-20 py-2")} value={v.pickupAddress} disabled={!canEdit} onChange={(e) => setV({ ...v, pickupAddress: e.target.value })} placeholder="e.g. 12 Admiralty Way, Lekki Phase 1, Lagos" />
        </L>
      </div>
      <L label="Pickup hours" hint="Optional">
        <input className={field} value={v.pickupHours} disabled={!canEdit} onChange={(e) => setV({ ...v, pickupHours: e.target.value })} placeholder="e.g. Mon–Sat, 10am–6pm" />
      </L>
      <Result r={r} />
      {canEdit && <button type="submit" disabled={pending} className={btn.primary}>{pending ? "Saving…" : "Save offer & pickup"}</button>}
    </form>
  );
}
