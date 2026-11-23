"use server";

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: Partial<Record<"name" | "email" | "message", string>>; values: Record<string, string> }
  | { status: "unavailable"; values: Record<string, string> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Contact form. Validates on the server; delivery (email or a support
 * inbox) is not connected yet, so it says so rather than claiming success.
 *
 * TODO: store messages in Supabase and/or email them to the business
 * address once supplied; add rate limiting and spam protection.
 */
export async function sendContactMessage(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const values = {
    name: String(fd.get("name") ?? "").trim().slice(0, 80),
    email: String(fd.get("email") ?? "").trim().slice(0, 254),
    orderRef: String(fd.get("orderRef") ?? "").trim().slice(0, 32),
    message: String(fd.get("message") ?? "").trim().slice(0, 2000),
  };
  const errors: Partial<Record<"name" | "email" | "message", string>> = {};
  if (values.name.length < 2) errors.name = "Please tell us your name.";
  if (!EMAIL.test(values.email)) errors.email = "Please enter a valid email address.";
  if (values.message.length < 10) errors.message = "Please write a little more so we can help.";
  if (Object.keys(errors).length) return { status: "invalid", errors, values };

  return { status: "unavailable", values };
}
