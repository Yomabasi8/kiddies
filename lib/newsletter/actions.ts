"use server";

export type NewsletterState =
  | { status: "idle" }
  | { status: "invalid"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "subscribed"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter sign-up. Validates on the server; storage is not connected
 * yet, so it reports that honestly instead of pretending to subscribe.
 *
 * TODO(supabase): insert into a `newsletter_subscribers` table (unique
 * email, consent timestamp) and add rate limiting before launch.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return { status: "invalid", message: "Please enter a valid email address." };
  }

  return {
    status: "unavailable",
    message: "Thanks! Our mailing list opens at launch, so please check back soon.",
  };
}
