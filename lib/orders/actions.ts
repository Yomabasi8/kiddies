"use server";

export type TrackState =
  | { status: "idle" }
  | { status: "invalid"; message: string; reference: string; contact: string }
  | { status: "not_found"; reference: string; contact: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NG_PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;

/**
 * Order lookup by reference plus the email or phone used at checkout. Both
 * must match, so guessing a reference reveals nothing, and a failed lookup
 * gives the same answer whether or not the reference exists.
 *
 * TODO(supabase): look up the order by reference AND contact, return the
 * status timeline, and rate-limit this action per IP.
 */
export async function trackOrder(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const reference = String(fd.get("reference") ?? "").trim().toUpperCase().slice(0, 32);
  const contact = String(fd.get("contact") ?? "").trim().slice(0, 254);

  if (!/^[A-Z0-9-]{6,32}$/.test(reference)) {
    return { status: "invalid", message: "Please enter the order reference from your confirmation email.", reference, contact };
  }
  const phone = contact.replace(/[\s-]/g, "");
  if (!EMAIL.test(contact) && !NG_PHONE.test(phone)) {
    return { status: "invalid", message: "Please enter the email or phone number you used at checkout.", reference, contact };
  }

  // No orders exist until checkout and payments are connected.
  return { status: "not_found", reference, contact };
}
