"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CreditCard, Info, Lock, ShoppingBag, Tag, UserRound, X } from "lucide-react";
import { previewCoupon, submitCheckout, type CheckoutField, type CheckoutState, type CouponPreview } from "@/lib/checkout/actions";
import { selectSubtotal, useCart } from "@/lib/cart-store";
import { NIGERIAN_STATES, deliveryMethodsFor, type DeliveryMethod } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartHydrated } from "@/components/cart/cart-button";
import { OrderSummaryTotals } from "@/components/cart/order-summary";
import { EmptyState } from "@/components/storefront/empty-state";

const initial: CheckoutState = { status: "idle" };

export function CheckoutView({ deliveryMethods }: { deliveryMethods: DeliveryMethod[] }) {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const syncFromServer = useCart((s) => s.syncFromServer);
  const [state, action, pending] = useActionState(submitCheckout, initial);
  const [mode, setMode] = useState<"guest" | "signin">("guest");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Extract<CouponPreview, { ok: true }> | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [applying, setApplying] = useState(false);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponMsg("");
    const r = await previewCoupon(couponInput, items.map((i) => ({ productId: i.productId, quantity: i.quantity })), "");
    setApplying(false);
    if (r.ok) {
      setCoupon(r);
      setCouponInput("");
    } else setCouponMsg(r.message);
  }

  const values = state.status === "idle" ? {} : state.values;
  const errors: Partial<Record<CheckoutField, string>> = state.status === "invalid" ? state.errors : {};
  const [region, setRegion] = useState(values.state ?? "");
  const [methodId, setMethodId] = useState(values.deliveryMethod ?? "");
  const methods = deliveryMethodsFor(deliveryMethods, region);
  // Default to the first option for the chosen state.
  const method = methods.find((m) => m.id === methodId) ?? methods[0];

  // Apply the server's cart corrections (stock / price changes).
  useEffect(() => {
    if (state.status === "cart_changed") syncFromServer(state.corrections);
  }, [state, syncFromServer]);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-[32px] bg-ink/[0.04]" aria-busy="true" />;
  if (items.length === 0 && state.status !== "cart_changed") {
    return (
      <EmptyState
        title="Nothing to check out yet"
        message="Your cart is empty. Add a few little treasures first."
        action={{ href: "/shop", label: "Go to the shop" }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div>
        {/* Guest vs sign in */}
        <div className="grid grid-cols-2 gap-2 rounded-full bg-[#F5F6F8] p-1.5" role="tablist" aria-label="Checkout options">
          {(["guest", "signin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("relative h-11 rounded-full text-sm font-bold transition-colors", mode === m ? "text-white" : "text-ink/60 hover:text-ink")}
            >
              {mode === m && <motion.span layoutId="checkout-mode" className="absolute inset-0 rounded-full bg-brand" />}
              <span className="relative">{m === "guest" ? "Continue as guest" : "Sign in"}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "signin" ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 rounded-[28px] bg-[#FDF8E9] p-8 text-center"
            >
              <UserRound className="mx-auto size-10 text-brand" />
              <h2 className="mt-3 font-display text-2xl font-semibold">Customer accounts are coming soon</h2>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink/60">
                You don&apos;t need an account to order. Check out as a guest and track your order with your order reference.
              </p>
              <button type="button" onClick={() => setMode("guest")} className="mt-6 h-11 rounded-full bg-coral px-6 text-sm font-bold text-white shadow-pop">
                Continue as guest
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="guest"
              // Submit manually so React doesn't reset the form afterwards:
              // values (including the controlled state select) stay put.
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                startTransition(() => action(data));
              }}
              noValidate
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-10"
            >
              <input type="hidden" name="cart" value={JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))} />
              <input type="hidden" name="coupon" value={coupon?.code ?? ""} />
              {items.map((i) => (
                <input key={i.productId} type="hidden" name={`price:${i.productId}`} value={i.unitPrice} />
              ))}

              <Status state={state} />

              <Section step={1} title="Contact information">
                <Field label="Full name" name="fullName" autoComplete="name" defaultValue={values.fullName} error={errors.fullName} className="sm:col-span-2" />
                <Field label="Email address" name="email" type="email" autoComplete="email" defaultValue={values.email} error={errors.email} hint="We'll send your order confirmation here." />
                <Field label="Phone number" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 123 4567" defaultValue={values.phone} error={errors.phone} />
              </Section>

              <Section step={2} title="Delivery details">
                <Field label="Delivery address" name="address" autoComplete="street-address" defaultValue={values.address} error={errors.address} className="sm:col-span-2" />
                <div>
                  <label htmlFor="state" className="mb-1.5 block text-sm font-bold">State</label>
                  <select
                    id="state"
                    name="state"
                    value={region}
                    onChange={(e) => {
                      setRegion(e.target.value);
                      setMethodId("");
                    }}
                    aria-invalid={!!errors.state || undefined}
                    aria-describedby={errors.state ? "state-error" : undefined}
                    className={inputCls(!!errors.state)}
                  >
                    <option value="">Choose a state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <FieldError id="state-error" message={errors.state} />
                </div>
                <Field label="City / LGA" name="city" autoComplete="address-level2" defaultValue={values.city} error={errors.city} />
                <div className="sm:col-span-2">
                  <label htmlFor="instructions" className="mb-1.5 block text-sm font-bold">
                    Delivery instructions <span className="font-semibold text-ink/40">(optional)</span>
                  </label>
                  <textarea id="instructions" name="instructions" rows={3} maxLength={300} defaultValue={values.instructions} placeholder="Landmarks, gate codes, best time to deliver…" className={cn(inputCls(false), "h-auto py-3")} />
                </div>
              </Section>

              <Section step={3} title="Delivery method">
                <fieldset className="sm:col-span-2" aria-describedby={errors.deliveryMethod ? "method-error" : undefined}>
                  <legend className="sr-only">Delivery method</legend>
                  {!region ? (
                    <p className="rounded-2xl bg-[#F5F6F8] px-5 py-4 text-sm font-semibold text-ink/55">Choose your state to see delivery options.</p>
                  ) : (
                    <div className="space-y-3">
                      {methods.map((m) => (
                        <label key={m.id} className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-ink/10 px-5 py-4 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-light/50">
                          <input type="radio" name="deliveryMethod" value={m.id} checked={method?.id === m.id} onChange={() => setMethodId(m.id)} className="size-5 accent-[#086f54]" />
                          <span className="flex-1">
                            <span className="block font-bold">{m.label}</span>
                            <span className="text-sm text-ink/55">{m.description}</span>
                          </span>
                          <span className="font-extrabold">{formatPrice(m.fee)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <FieldError id="method-error" message={errors.deliveryMethod} />
                </fieldset>
              </Section>

              <Section step={4} title="Payment">
                <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-ink/15 px-5 py-4 text-sm text-ink/60">
                  <p className="flex items-center gap-2 font-bold text-ink">
                    <CreditCard className="size-4" /> Pay securely online
                  </p>
                  <p className="mt-1">You&apos;ll be taken to Paystack to pay by card, bank transfer or USSD, then brought back here. We never see or store your card details.</p>
                </div>
              </Section>

              <motion.button
                type="submit"
                disabled={pending}
                whileHover={{ y: -2 }}
                whileTap={{ y: 4 }}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-coral text-base font-bold text-white shadow-pop disabled:opacity-70"
              >
                <Lock className="size-4" />
                {pending ? "Taking you to secure payment…" : `Continue to payment${method ? ` · ${formatPrice(subtotal - (coupon?.discount ?? 0) + method.fee)}` : ""}`}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Order summary */}
      <aside aria-labelledby="checkout-summary" className="h-fit rounded-[32px] border-[3px] border-ink bg-white p-7 shadow-[0_8px_0_0_#1b1b1b] lg:sticky lg:top-32">
        <div className="flex items-center justify-between">
          <h2 id="checkout-summary" className="font-display text-2xl font-semibold">Your order</h2>
          <Link href="/cart" className="text-sm font-bold text-ink/50 hover:text-brand">Edit</Link>
        </div>
        <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1" data-lenis-prevent>
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-[#F5F6F8]">
                {i.image ? <Image src={i.image} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" /> : <ShoppingBag className="absolute inset-0 m-auto size-5 text-ink/25" />}
                <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{i.quantity}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold leading-snug">{i.name}</span>
              <span className="text-sm font-extrabold">{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {/* Coupon */}
        <div className="mt-6 border-t-2 border-ink/10 pt-5">
          {coupon ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-light px-4 py-3">
              <span className="flex items-center gap-2 text-sm">
                <Tag className="size-4 text-brand" />
                <span><span className="font-mono font-bold">{coupon.code}</span> <span className="text-ink/60">· {coupon.description}</span></span>
              </span>
              <button type="button" onClick={() => setCoupon(null)} aria-label="Remove coupon" className="grid size-7 place-items-center rounded-full hover:bg-white">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="coupon-code" className="text-sm font-bold">Coupon code</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="coupon-code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  aria-invalid={!!(couponMsg || errors.coupon) || undefined}
                  aria-describedby="coupon-msg"
                  className="h-11 min-w-0 flex-1 rounded-xl border-2 border-ink/10 px-3 font-mono text-sm uppercase outline-none focus:border-brand"
                />
                <button type="button" onClick={applyCoupon} disabled={applying || !couponInput.trim()} className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-40">
                  {applying ? "…" : "Apply"}
                </button>
              </div>
              {(couponMsg || errors.coupon) && (
                <p id="coupon-msg" role="alert" className="mt-1.5 text-sm font-semibold text-coral">{couponMsg || errors.coupon}</p>
              )}
            </div>
          )}
        </div>
        <OrderSummaryTotals subtotal={subtotal} discount={coupon?.discount ?? 0} delivery={method ? method.fee : null} className="mt-5" />
      </aside>
    </div>
  );
}

function Status({ state }: { state: CheckoutState }) {
  if (state.status === "idle") return null;
  const tone =
    state.status === "payment_unavailable"
      ? { cls: "bg-[#E6F1FB] text-[#1F4E86]", Icon: Info }
      : { cls: "bg-[#FFEDE6] text-[#9C3A20]", Icon: AlertCircle };
  return (
    <div role="alert" className={cn("flex gap-3 rounded-2xl px-5 py-4 text-sm font-semibold", tone.cls)}>
      <tone.Icon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        {state.status === "invalid" && <p>{state.errors.cart ?? "Please check the highlighted fields."}</p>}
        {state.status === "cart_changed" && state.messages.map((m) => <p key={m}>{m}</p>)}
        {(state.status === "payment_unavailable" || state.status === "payment_error") && <p>{state.message}</p>}
      </div>
    </div>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-3 font-display text-xl font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-sunny text-sm text-ink">{step}</span>
        {title}
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

const inputCls = (invalid: boolean) =>
  cn(
    "h-12 w-full rounded-xl border-2 bg-white px-4 text-[15px] outline-none transition-colors focus:border-brand",
    invalid ? "border-coral" : "border-ink/10",
  );

function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: { label: string; name: string; error?: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [error && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold">{label}</label>
      <input id={name} name={name} aria-invalid={!!error || undefined} aria-describedby={describedBy} className={inputCls(!!error)} {...props} />
      {hint && !error && <p id={`${name}-hint`} className="mt-1.5 text-xs text-ink/50">{hint}</p>}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-coral">
      <AlertCircle className="size-4" /> {message}
    </p>
  );
}
