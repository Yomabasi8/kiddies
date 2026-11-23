"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { saveCoupon, type CouponFormState } from "@/lib/admin/coupon-actions";
import type { CouponFormValues } from "@/lib/admin/coupon-types";
import { cn } from "@/lib/utils";
import { btn, field } from "./ui";

type Option = { id: string; name: string };

export function CouponForm({ initial, products, categories }: { initial: CouponFormValues; products: Option[]; categories: Option[] }) {
  const [v, setV] = useState(initial);
  const [state, action, pending] = useActionState(saveCoupon, { status: "idle" } as CouponFormState);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const set = <K extends keyof CouponFormValues>(k: K, val: CouponFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const toggle = (k: "productIds" | "categoryIds", id: string) =>
    set(k, v[k].includes(id) ? v[k].filter((x) => x !== id) : [...v[k], id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("payload", JSON.stringify(v));
    startTransition(() => action(fd));
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {state.status === "error" && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle className="size-4" /> {state.message}</p>
        )}
        <Box title="Coupon">
          <Field label="Code" hint="Customers type this at checkout" error={errors.code}>
            <input className={cn(field, "font-mono uppercase")} value={v.code} aria-invalid={!!errors.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="e.g. WELCOME10" />
          </Field>
          <Field label="Internal description" hint="Optional, for your reference">
            <input className={field} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </Box>

        <Box title="Discount">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink/5 p-1" role="radiogroup" aria-label="Discount type">
            {(["percent", "fixed"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={v.discountType === t} onClick={() => set("discountType", t)} className={cn("rounded-md py-2 text-sm font-bold", v.discountType === t ? "bg-white shadow-sm" : "text-ink/55")}>
                {t === "percent" ? "Percentage (%)" : "Fixed amount (₦)"}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={v.discountType === "percent" ? "Percentage off" : "Amount off (₦)"} error={errors.value}>
              <input className={field} inputMode="decimal" value={v.value} aria-invalid={!!errors.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            <Field label="Minimum spend (₦)" hint="Optional" error={errors.minSubtotal}>
              <input className={field} inputMode="decimal" value={v.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} />
            </Field>
          </div>
        </Box>

        <Box title="Applies to">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Applies to">
            {([["all", "Everything"], ["categories", "Selected categories"], ["products", "Selected products"]] as const).map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={v.scope === k} onClick={() => set("scope", k)} className={cn("rounded-lg border px-3 py-2 text-sm font-semibold", v.scope === k ? "border-brand bg-brand/10 text-brand" : "border-ink/15")}>{label}</button>
            ))}
          </div>
          {v.scope !== "all" && (
            <div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-ink/10 p-2">
                {(v.scope === "products" ? products : categories).map((o) => {
                  const key = v.scope === "products" ? "productIds" : "categoryIds";
                  return (
                    <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ink/5">
                      <input type="checkbox" checked={v[key].includes(o.id)} onChange={() => toggle(key, o.id)} className="size-4 accent-[#086f54]" />
                      {o.name}
                    </label>
                  );
                })}
              </div>
              {(errors.productIds || errors.categoryIds) && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{errors.productIds || errors.categoryIds}</p>}
            </div>
          )}
        </Box>
      </div>

      <div className="space-y-6">
        <Box title="Schedule & limits">
          <Field label="Starts" hint="Optional · Nigeria time">
            <input type="datetime-local" className={field} value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </Field>
          <Field label="Ends" hint="Optional" error={errors.endsAt}>
            <input type="datetime-local" className={field} value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </Field>
          <Field label="Total uses allowed" hint="Leave blank for unlimited" error={errors.usageLimit}>
            <input className={field} inputMode="numeric" value={v.usageLimit} onChange={(e) => set("usageLimit", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Uses per customer" hint="Matched by email" error={errors.perCustomerLimit}>
            <input className={field} inputMode="numeric" value={v.perCustomerLimit} onChange={(e) => set("perCustomerLimit", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
            Active
            <input type="checkbox" role="switch" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-5 accent-[#086f54]" />
          </label>
          <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>{pending ? "Saving…" : v.id ? "Save coupon" : "Create coupon"}</button>
        </Box>
      </div>
    </form>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white">
      <h2 className="border-b border-ink/10 px-5 py-3.5 text-[15px] font-bold">{title}</h2>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-ink/50">{hint}</span> : null}
    </label>
  );
}
