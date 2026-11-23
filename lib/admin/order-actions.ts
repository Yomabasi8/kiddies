"use server";

import { revalidatePath, updateTag } from "next/cache";
import { audit, requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/catalog";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const ORDER_STATUSES = ["processing", "dispatched", "delivered", "cancelled"] as const;
type SettableStatus = (typeof ORDER_STATUSES)[number];
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

/** Move an order along its lifecycle. Never to 'paid' (payments do that). */
export async function setOrderStatus(orderId: string, to: SettableStatus, note: string): Promise<ActionResult> {
  const actor = await requireStaff();
  if (!isUuid(orderId) || !ORDER_STATUSES.includes(to)) return { ok: false, message: "Invalid request." };
  const { data, error } = await createAdminClient().rpc("admin_set_order_status", {
    p_order_id: orderId,
    p_to: to,
    p_note: note.slice(0, 500),
    p_actor: actor.id,
  });
  if (error) return { ok: false, message: "Couldn't update the order. Please try again." };
  if (data === "invalid_transition") return { ok: false, message: "That status change isn't allowed from the order's current status." };
  if (data !== "ok") return { ok: false, message: "Order not found." };
  if (to === "cancelled") updateTag(CATALOG_TAG); // stock may have been restored
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: `Order marked as ${to}.` };
}

export async function saveTracking(orderId: string, trackingNumber: string, trackingUrl: string): Promise<ActionResult> {
  const actor = await requireStaff();
  if (!isUuid(orderId)) return { ok: false, message: "Invalid request." };
  const number = trackingNumber.trim().slice(0, 80);
  const url = trackingUrl.trim().slice(0, 500);
  if (url && !/^https:\/\/[^\s]+$/i.test(url)) return { ok: false, message: "Tracking link must start with https://" };
  const { error } = await createAdminClient()
    .from("orders")
    .update({ tracking_number: number || null, tracking_url: url || null })
    .eq("id", orderId);
  if (error) return { ok: false, message: "Couldn't save tracking details." };
  await audit(actor, "order.tracking", "order", orderId, { tracking_number: number || null });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Tracking details saved." };
}

export async function addOrderNote(orderId: string, body: string): Promise<ActionResult> {
  const actor = await requireStaff();
  const text = body.trim().slice(0, 2000);
  if (!isUuid(orderId) || !text) return { ok: false, message: "Write a note first." };
  const { error } = await createAdminClient().from("order_notes").insert({ order_id: orderId, body: text, author_id: actor.id });
  if (error) return { ok: false, message: "Couldn't add the note." };
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Note added." };
}

/**
 * Record a refund already made in the Paystack dashboard.
 * TODO(paystack): initiate refunds via the Paystack Refund API instead.
 */
export async function recordRefund(orderId: string, amountNaira: string, restock: boolean, note: string): Promise<ActionResult> {
  const actor = await requireStaff();
  const amount = Math.round(Number(amountNaira.replace(/[,\s₦]/g, "")) * 100);
  if (!isUuid(orderId) || !Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter the amount refunded." };
  const { data, error } = await createAdminClient().rpc("admin_record_refund", {
    p_order_id: orderId,
    p_amount: amount,
    p_restock: restock,
    p_note: note.slice(0, 500),
    p_actor: actor.id,
  });
  if (error) return { ok: false, message: "Couldn't record the refund." };
  const messages: Record<string, string> = {
    no_verified_payment: "This order has no verified payment to refund.",
    invalid_amount: "That amount is more than what's left to refund.",
    not_found: "Order not found.",
  };
  if (data !== "ok") return { ok: false, message: messages[data as string] ?? "Couldn't record the refund." };
  if (restock) updateTag(CATALOG_TAG);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Refund recorded." };
}
