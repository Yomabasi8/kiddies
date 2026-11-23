"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type TrackedOrder = {
  reference: string;
  status: string;
  placedAt: string;
  total: number;
  itemCount: number;
  deliveryArea: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  timeline: { status: string; at: string }[];
};

export type TrackState =
  | { status: "idle" }
  | { status: "invalid"; message: string; reference: string; contact: string }
  | { status: "not_found"; reference: string; contact: string }
  | { status: "found"; order: TrackedOrder; reference: string; contact: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NG_PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;
/** Last 10 digits, so 0803…, +234803… and 234803… all match. */
const phoneKey = (p: string) => p.replace(/\D/g, "").slice(-10);

/**
 * Order lookup by reference plus the email or phone used at checkout. Both
 * must match, and every miss returns the same answer, so a guessed
 * reference reveals nothing about whether an order exists.
 *
 * TODO(launch): add per-IP rate limiting (e.g. Vercel Firewall / Upstash).
 */
export async function trackOrder(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const reference = String(fd.get("reference") ?? "").trim().toUpperCase().slice(0, 32);
  const contact = String(fd.get("contact") ?? "").trim().slice(0, 254);

  if (!/^KA-[A-Z0-9]{6,16}$/.test(reference)) {
    return { status: "invalid", message: "Please enter the order reference from your confirmation (it starts with KA-).", reference, contact };
  }
  const isEmail = EMAIL.test(contact);
  if (!isEmail && !NG_PHONE.test(contact.replace(/[\s-]/g, ""))) {
    return { status: "invalid", message: "Please enter the email or phone number you used at checkout.", reference, contact };
  }

  const { data: o } = await createAdminClient()
    .from("orders")
    .select("id, reference, email, phone, status, created_at, total, city, state, tracking_number, tracking_url, order_items(quantity), order_status_history(to_status, created_at)")
    .eq("reference", reference)
    .maybeSingle();

  const matches = o && (isEmail ? o.email.toLowerCase() === contact.toLowerCase() : phoneKey(o.phone) === phoneKey(contact));
  if (!o || !matches) return { status: "not_found", reference, contact };

  type Hist = { to_status: string; created_at: string };
  return {
    status: "found",
    reference,
    contact,
    order: {
      reference: o.reference,
      status: o.status,
      placedAt: o.created_at,
      total: o.total,
      itemCount: (o.order_items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0),
      deliveryArea: `${o.city}, ${o.state}`,
      trackingNumber: o.tracking_number,
      trackingUrl: o.tracking_url,
      timeline: ([...(o.order_status_history as Hist[])].sort((a, b) => a.created_at.localeCompare(b.created_at))).map((h) => ({ status: h.to_status, at: h.created_at })),
    },
  };
}
