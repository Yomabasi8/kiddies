"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, paystackConfigured } from "@/lib/payments/paystack";

import { getProductsByIds, effectivePrice } from "@/lib/catalog";
import { NIGERIAN_STATES, chargeFor, deliveryMethodsFor } from "@/lib/delivery";
import { getDeliveryMethodsFresh, getFreeDeliveryDaysFresh } from "@/lib/delivery-data";
import { isInFirstMonth } from "@/lib/free-delivery";
import { formatPrice } from "@/lib/format";
import { checkCoupon, type CouponLine } from "@/lib/coupons";

export type CheckoutField = "fullName" | "email" | "phone" | "address" | "state" | "city" | "instructions" | "deliveryMethod" | "coupon" | "cart";

export type CheckoutValues = Partial<Record<Exclude<CheckoutField, "cart">, string>>;

export type CartCorrection = { productId: string; quantity: number; unitPrice: number; stock: number };

export type CheckoutState =
  | { status: "idle" }
  | { status: "invalid"; errors: Partial<Record<CheckoutField, string>>; values: CheckoutValues }
  | { status: "cart_changed"; messages: string[]; corrections: CartCorrection[]; values: CheckoutValues }
  | { status: "payment_error"; message: string; values: CheckoutValues }
  | {
      status: "payment_unavailable";
      message: string;
      values: CheckoutValues;
      totals: { subtotal: number; discount: number; delivery: number; total: number };
    };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Nigerian mobile numbers: 0803…, +234803…, 234803…. */
const NG_PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;

const text = (fd: FormData, key: string, max = 200) => String(fd.get(key) ?? "").trim().slice(0, max);

/**
 * Validates guest checkout details, re-checks every cart line against the
 * catalogue (existence, stock, current price) and computes totals on the
 * server. Client-side prices are never trusted.
 *
 * Payment is the next integration step (Paystack or Flutterwave). Until a
 * provider is configured this stops before creating an order and says so;
 * it never reports a payment or order that didn't happen.
 *
 * TODO(supabase): create a pending order + payment record, then initialise
 * the provider transaction and redirect to its checkout URL. Mark the order
 * paid only after server-side verification or a verified webhook.
 */
export async function submitCheckout(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const values: CheckoutValues = {
    fullName: text(fd, "fullName", 80),
    email: text(fd, "email", 254).toLowerCase(),
    phone: text(fd, "phone", 20),
    address: text(fd, "address", 200),
    state: text(fd, "state", 40),
    city: text(fd, "city", 80),
    instructions: text(fd, "instructions", 300),
    deliveryMethod: text(fd, "deliveryMethod", 40),
    coupon: text(fd, "coupon", 32).toUpperCase(),
  };

  const errors: Partial<Record<CheckoutField, string>> = {};
  if ((values.fullName ?? "").length < 2) errors.fullName = "Please enter your full name.";
  if (!EMAIL.test(values.email ?? "")) errors.email = "Please enter a valid email address.";
  if (!NG_PHONE.test((values.phone ?? "").replace(/[\s-]/g, ""))) errors.phone = "Please enter a valid Nigerian phone number, e.g. 0803 123 4567.";
  const [allMethods, freeDays] = await Promise.all([getDeliveryMethodsFresh(), getFreeDeliveryDaysFresh()]);
  const method = deliveryMethodsFor(allMethods, values.state).find((m) => m.id === values.deliveryMethod);
  const pickup = !!method?.isPickup;
  if (pickup) {
    // Pickup orders keep the store's pickup point as their "address".
    values.address = `Store pickup: ${method!.pickupAddress}`;
    values.city = values.city || "Pickup";
  }
  if ((values.address ?? "").length < 5) errors.address = "Please enter your delivery address.";
  if (!NIGERIAN_STATES.includes(values.state as (typeof NIGERIAN_STATES)[number])) errors.state = "Please choose your state.";
  if ((values.city ?? "").length < 2) errors.city = "Please enter your city or LGA.";
  if (!method) errors.deliveryMethod = "Please choose a delivery option.";

  // Parse the cart lines the browser sent (ids + quantities only).
  let lines: { productId: string; quantity: number }[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("cart") ?? "[]"));
    if (Array.isArray(parsed)) {
      lines = parsed
        .filter((l) => typeof l?.productId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
        .slice(0, 100);
    }
  } catch {
    // Treated as an empty cart below.
  }
  if (lines.length === 0) errors.cart = "Your cart is empty.";

  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  // Re-validate against the catalogue.
  const products = await getProductsByIds(lines.map((l) => l.productId));
  const messages: string[] = [];
  const corrections: CartCorrection[] = [];
  let subtotal = 0;
  const couponLines: CouponLine[] = [];
  const orderItems: { product_id: string; product_name: string; sku: string; image_url: string | null; unit_price: number; quantity: number }[] = [];

  for (const line of lines) {
    const p = products.get(line.productId);
    if (!p) {
      messages.push("An item in your cart is no longer available and was removed.");
      corrections.push({ productId: line.productId, quantity: 0, unitPrice: 0, stock: 0 });
      continue;
    }
    const unitPrice = effectivePrice(p);
    const quantity = Math.min(line.quantity, p.stock);
    if (p.stock <= 0) messages.push(`${p.name} has just sold out and was removed.`);
    else if (quantity < line.quantity) messages.push(`Only ${p.stock} of ${p.name} left, so we updated the quantity.`);
    corrections.push({ productId: p.id, quantity, unitPrice, stock: p.stock });
    subtotal += unitPrice * quantity;
    if (quantity > 0) {
      couponLines.push({ productId: p.id, categoryId: p.categoryId, unitPrice, quantity });
      orderItems.push({ product_id: p.id, product_name: p.name, sku: p.sku, image_url: p.image, unit_price: unitPrice, quantity });
    }
  }

  const priceChanged = corrections.some((c) => {
    const sent = Number((fd.get(`price:${c.productId}`) as string) ?? NaN);
    return c.quantity > 0 && Number.isFinite(sent) && sent !== c.unitPrice;
  });
  if (priceChanged) messages.push("Some prices have changed since you added them. Your cart now shows current prices.");

  if (messages.length > 0) return { status: "cart_changed", messages: [...new Set(messages)], corrections, values };

  // Coupons are re-validated here against server prices, never trusted from the client.
  let discount = 0;
  let couponId: string | null = null;
  if (values.coupon) {
    const coupon = await checkCoupon(values.coupon, couponLines, values.email ?? null);
    if (!coupon.ok) return { status: "invalid", errors: { coupon: coupon.message }, values };
    discount = coupon.discount;
    couponId = coupon.couponId;
  }

  // Pickup is always free; delivery is free in a customer's first month with us.
  const firstMonth = await isInFirstMonth(values.email ?? null, values.phone ?? null, freeDays);
  const delivery = chargeFor(method!, firstMonth);
  const total = subtotal - discount + delivery;

  if (!paystackConfigured()) {
    return {
      status: "payment_unavailable",
      values,
      totals: { subtotal, discount, delivery, total },
      message: `Your details and cart check out (total ${formatPrice(total)}), but online payment isn't switched on yet, so no order has been placed and you haven't been charged.`,
    };
  }

  // 1. Record the pending order (items, prices, payment) in one transaction.
  const db = createAdminClient();
  const paymentReference = `KAP-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  const { data: created, error: createError } = await db
    .rpc("create_checkout_order", {
      p_order: {
        email: values.email,
        full_name: values.fullName,
        phone: values.phone!.replace(/[\s-]/g, ""),
        address_line: values.address,
        city: values.city,
        state: values.state,
        instructions: values.instructions,
        delivery_method_id: method!.id,
        delivery_method_label: method!.label,
        subtotal,
        discount_total: discount,
        delivery_fee: delivery,
        total,
        coupon_id: couponId,
        coupon_code: couponId ? values.coupon : null,
      },
      p_items: orderItems,
      p_payment_reference: paymentReference,
    })
    .single<{ order_id: string; order_reference: string }>();
  if (createError || !created) {
    console.error("[checkout] creating order failed", createError?.message);
    return { status: "payment_error", values, message: "We couldn't place your order just now. You haven't been charged. Please try again." };
  }

  // 2. Start the Paystack payment and send the customer to its secure page.
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  let paymentUrl: string;
  try {
    const tx = await initializeTransaction({
      email: values.email!,
      amount: total,
      reference: paymentReference,
      callbackUrl: `${site}/api/checkout/callback`,
      metadata: {
        order_id: created.order_id,
        order_reference: created.order_reference,
        cancel_action: `${site}/checkout`,
      },
    });
    paymentUrl = tx.authorization_url;
  } catch (err) {
    console.error("[checkout] starting payment failed", err);
    await db.rpc("mark_payment_unsuccessful", { p_reference: paymentReference, p_status: "failed", p_raw: null });
    await db.rpc("admin_set_order_status", { p_order_id: created.order_id, p_to: "cancelled", p_note: "Payment could not be started", p_actor: null });
    return { status: "payment_error", values, message: "We couldn't connect to our payment provider. You haven't been charged. Please try again in a moment." };
  }

  redirect(paymentUrl);
}


export type CouponPreview =
  | { ok: true; code: string; discount: number; description: string }
  | { ok: false; message: string };

/** Checkout "Apply" button: price the cart on the server and check the code. */
export async function previewCoupon(code: string, cart: { productId: string; quantity: number }[], email: string): Promise<CouponPreview> {
  const lines = (Array.isArray(cart) ? cart : []).filter((l) => typeof l?.productId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0).slice(0, 100);
  if (!lines.length) return { ok: false, message: "Your cart is empty." };
  const products = await getProductsByIds(lines.map((l) => l.productId));
  const couponLines: CouponLine[] = [];
  for (const l of lines) {
    const p = products.get(l.productId);
    if (!p || p.stock <= 0) continue;
    couponLines.push({ productId: p.id, categoryId: p.categoryId, unitPrice: effectivePrice(p), quantity: Math.min(l.quantity, p.stock) });
  }
  const r = await checkCoupon(String(code ?? "").slice(0, 32), couponLines, EMAIL.test(email) ? email.toLowerCase() : null);
  return r.ok ? { ok: true, code: r.code, discount: r.discount, description: r.description } : r;
}

/**
 * Checkout preview: does this email/phone get first-month free delivery?
 * Answers only yes/no for the details the shopper typed themselves.
 * The order total is always recomputed on submit.
 */
export async function previewFreeDelivery(email: string, phone: string): Promise<boolean> {
  const e = String(email ?? "").trim().toLowerCase();
  const p = String(phone ?? "").replace(/[\s-]/g, "");
  if (!EMAIL.test(e) || !NG_PHONE.test(p)) return false;
  try {
    return await isInFirstMonth(e, p, await getFreeDeliveryDaysFresh());
  } catch {
    return false;
  }
}
