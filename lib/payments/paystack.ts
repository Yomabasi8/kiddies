import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Paystack client. Server-only: uses PAYSTACK_SECRET_KEY, which
 * must never reach the browser.
 *
 * Docs: https://paystack.com/docs/api/transaction/
 */

const BASE = "https://api.paystack.co";

export function paystackConfigured() {
  return /^sk_(test|live)_/.test(process.env.PAYSTACK_SECRET_KEY ?? "");
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack is not configured");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      // Paystack's edge rejects requests without a client user-agent.
      "User-Agent": "kiddies-accessories/1.0",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack ${path.split("?")[0]} failed (${res.status}): ${body?.message ?? "no response"}`);
  }
  return body.data as T;
}

/** Start a transaction; returns the hosted payment page URL. */
export async function initializeTransaction(input: {
  email: string;
  amount: number; // kobo
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export type PaystackTransaction = {
  id: number;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "queued" | "reversed";
  reference: string;
  amount: number; // kobo
  currency: string;
  channel: string | null;
  paid_at: string | null;
  gateway_response: string | null;
};

/** Ask Paystack directly for the transaction's real status. */
export async function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Webhooks are signed with HMAC-SHA512 of the raw body using the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

/** Only the fields worth keeping from a verified transaction (no card data). */
export function summarise(tx: PaystackTransaction) {
  return {
    id: tx.id,
    status: tx.status,
    reference: tx.reference,
    amount: tx.amount,
    currency: tx.currency,
    channel: tx.channel,
    paid_at: tx.paid_at,
    gateway_response: tx.gateway_response,
  };
}
