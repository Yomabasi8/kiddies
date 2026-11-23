"use server";

import { getProductsByIds, effectivePrice } from "@/lib/catalog";
import { NIGERIAN_STATES, deliveryMethodsFor } from "@/lib/delivery";
import { getDeliveryMethodsFresh } from "@/lib/delivery-data";
import { formatPrice } from "@/lib/format";

export type CheckoutField = "fullName" | "email" | "phone" | "address" | "state" | "city" | "instructions" | "deliveryMethod" | "cart";

export type CheckoutValues = Partial<Record<Exclude<CheckoutField, "cart">, string>>;

export type CartCorrection = { productId: string; quantity: number; unitPrice: number; stock: number };

export type CheckoutState =
  | { status: "idle" }
  | { status: "invalid"; errors: Partial<Record<CheckoutField, string>>; values: CheckoutValues }
  | { status: "cart_changed"; messages: string[]; corrections: CartCorrection[]; values: CheckoutValues }
  | {
      status: "payment_unavailable";
      message: string;
      values: CheckoutValues;
      totals: { subtotal: number; delivery: number; total: number };
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
  };

  const errors: Partial<Record<CheckoutField, string>> = {};
  if ((values.fullName ?? "").length < 2) errors.fullName = "Please enter your full name.";
  if (!EMAIL.test(values.email ?? "")) errors.email = "Please enter a valid email address.";
  if (!NG_PHONE.test((values.phone ?? "").replace(/[\s-]/g, ""))) errors.phone = "Please enter a valid Nigerian phone number, e.g. 0803 123 4567.";
  if ((values.address ?? "").length < 5) errors.address = "Please enter your delivery address.";
  if (!NIGERIAN_STATES.includes(values.state as (typeof NIGERIAN_STATES)[number])) errors.state = "Please choose your state.";
  if ((values.city ?? "").length < 2) errors.city = "Please enter your city or LGA.";
  const method = deliveryMethodsFor(await getDeliveryMethodsFresh(), values.state).find((m) => m.id === values.deliveryMethod);
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
  }

  const priceChanged = corrections.some((c) => {
    const sent = Number((fd.get(`price:${c.productId}`) as string) ?? NaN);
    return c.quantity > 0 && Number.isFinite(sent) && sent !== c.unitPrice;
  });
  if (priceChanged) messages.push("Some prices have changed since you added them. Your cart now shows current prices.");

  if (messages.length > 0) return { status: "cart_changed", messages: [...new Set(messages)], corrections, values };

  const delivery = method!.fee;
  const total = subtotal + delivery;

  return {
    status: "payment_unavailable",
    values,
    totals: { subtotal, delivery, total },
    message: `Your details and cart check out (total ${formatPrice(total)}), but online payment isn't switched on yet, so no order has been placed and you haven't been charged.`,
  };
}
